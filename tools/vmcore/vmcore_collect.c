#include <stdio.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdarg.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include "libnfs.h"
#include "libnfs-raw.h"
#include "libnfs-raw-mount.h"

#include <dirent.h>
#include <unistd.h>
#include <sys/stat.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <string.h>
#include <sys/time.h>
#include <fcntl.h>
#include <sys/file.h>
#include <sys/utsname.h>

#define USEC_PER_SEC    1000000L
#define CRASH_DIR       "/var/crash"
#define LOG_FILE        "/tmp/vmcore_collect.log"
#define LOCK_FILE       "/var/lock/vmcore_collect.pid"
#define MOUNT_INFO_FILE "/proc/self/mountinfo"
#define ERR_LOG(fmt, args...) err_log(__LINE__, fmt, ##args)
#define CONF_FILE_1     "/etc/vmcore_collect.conf"
#define CONF_FILE_2     "panic/config.txt"
#define UPLOAD_FILE     ".uploaded"
#define FLAGS_LOG       2
#define BUFSIZE         1024*1024
#define PR_CONF(key, args...) snprintf(gconf.key, sizeof(gconf.key), ##args)


struct cv_config_t {
    char crashdir[128];
    char hostname[128];
    char nfs_ip[64];
    char nfs_dir[128];
    FILE *fp;
} gconf;


static int gerrcode = 0;
static int glockfd = -1;
const char *file_list[] = {"vmcore", "vmcore-incomplete", "vmcore-dmesg.txt", UPLOAD_FILE};

struct nfs_context *nfs = NULL;
struct nfsfh *nfsfh = NULL;
struct nfs_url *url = NULL;

static int get_disk_usage(const char path[]);
int  mount_nfs(char* dir, int is_dir);
int  nfs_copy(int fd, int size, char* file);
int64_t get_now_time()
{
    struct timeval tv;
    gettimeofday(&tv, 0);
    return USEC_PER_SEC * tv.tv_sec + tv.tv_usec;
}

void trim_string(char *val, char found)
{
    char *end = val + strlen(val) - 1;

    while (end >= val && *end == found)
        *end-- = '\0';
}

int endswith(char* str, char* p)
{
    int lens,lenp;
    lens = strlen(str);
    lenp = strlen(p);

    if(lenp <=0 || lens <= 0)
        return -1;

    if(strcmp(str+lens-lenp,p) == 0)
        return 0;
    return -1;
}

static ssize_t
file_pread(int fd, char *buf, size_t count, off_t off)
{
    lseek(fd, off, SEEK_SET);
    return read(fd, buf, count);
}

static ssize_t
file_pwrite(char *buf, size_t count, off_t off)
{
    return nfs_pwrite(nfs, nfsfh, off, count, buf);
}

void err_log(int line, const char *fmt, ...)
{
    int n;
    struct timeval tv;
    char b[256];

    gettimeofday(&tv, 0);
    strftime(b, sizeof(b), "%Y-%m-%d %H:%M:%S", localtime(&tv.tv_sec));
    n = strlen(b);
    n += snprintf(b + n, sizeof(b) - n, ".%06ld [%d] - ", tv.tv_usec, line);

    va_list args;
    va_start(args, fmt);
    vsnprintf(b + n, sizeof(b) - n , fmt, args);
    va_end(args);
    fprintf(gconf.fp, b);
    fflush(gconf.fp);
}

time_t convert_time(const char *str)
{
    char *p;
    struct tm tm;
    int len;

    if ((p = strchr(str, '-')) == NULL)
        return 0;

    p ++;
    len = strlen(str) - (p - str);

    if (len != 19)
        return 0;

    memset(&tm, 0, sizeof(tm));

    if (sscanf(p, "%04d-%02d-%02d-%02d:%02d:%02d",
           &tm.tm_year, &tm.tm_mon, &tm.tm_mday,
           &tm.tm_hour, &tm.tm_min, &tm.tm_sec) != 6)
        return 0;

    tm.tm_mon--;
    tm.tm_isdst = -1;
    tm.tm_year -= 1900;
    return mktime(&tm);
}

uint32_t get_local_addr()
{
    int fd = -1;
    uint32_t ret = 0;
    struct sockaddr_in addr;
    socklen_t addrlen = sizeof(addr);

    addr.sin_family = AF_INET;
    addr.sin_port = 165;
    addr.sin_addr.s_addr = inet_addr("30.30.30.30");

    if ((fd = socket(AF_INET, SOCK_DGRAM, 0)) < 0)
        goto error_exit;

    if (connect(fd, (struct sockaddr *) &addr, addrlen) < 0)
        goto error_exit;

    if (getsockname(fd, (struct sockaddr *) &addr, &addrlen) < 0)
        goto error_exit;

    ret = addr.sin_addr.s_addr;
error_exit:

    if (fd >= 0)
        close(fd);

    return ret;
}




void check_dir(const char *dirpath)
{
    DIR *dirp;
    struct dirent *direntp;
    time_t core_time = 0;
    struct stat st;
    char tmp[256];
    char skip[256];
    char dst_dmesg[256];
    char nowstr[32];
    int skip_flag;
    int off = 0;
    int count;
    int fd,n;
	int i;

    if ((dirp = opendir(dirpath)) == NULL)
        return;

    while ((direntp = readdir(dirp)) != NULL) {
        snprintf(tmp, sizeof(tmp), "%s/%s", dirpath, direntp->d_name);
        printf("check %s\n",tmp);

        if (memcmp(direntp->d_name, ".", 2) == 0 ||
            memcmp(direntp->d_name, "..", 3) == 0)
            continue;

        if (stat(tmp, &st) || S_ISDIR(st.st_mode) == 0)
            continue;

        core_time = convert_time(direntp->d_name);

        if (core_time == 0) {
            ERR_LOG("skip: %s\n", tmp);
            continue;
        }

        snprintf(skip, sizeof(skip), "%s/%s", tmp, UPLOAD_FILE);
        skip_flag = ((stat(skip, &st) == 0) ? 1 : 0);
        printf("check skip : %s skip_flag:%d\n",skip,skip_flag);
        if (skip_flag == 1)
            continue;

        //add_core_dir(core_time, tmp, skip_flag);
        //src:tmp/vmcore-dmesg.txt, dst:url->path/*-dmesg.txt
        strftime(nowstr, sizeof(nowstr), "%Y%m%d%H%M%S", localtime(&core_time));
        snprintf(tmp, sizeof(tmp), "%s_%s", nowstr, gconf.hostname);
        printf("mount : %s\n",tmp);
        if (mount_nfs(tmp,1) != 0)
        {
            printf("mount nfs failed! file:%s\n",tmp);
            exit(1);
        }
		for(i = 0; i < 3; i++)
		{
        	snprintf(dst_dmesg, sizeof(dst_dmesg), "%s/%s/%s", dirpath, direntp->d_name, file_list[i]);
        	printf("check vmcore : %s\n",dst_dmesg);
        	if(stat(dst_dmesg, &st) != 0)
        	    continue;

        	if((fd = open(dst_dmesg, O_RDONLY, 0660)) == -1)
        	{
        	    printf("can not open file %s to copy to nfs\n", dst_dmesg);
        	    continue;
        	}
    

        	snprintf(dst_dmesg, sizeof(dst_dmesg), "%s/%s", tmp, file_list[i]);
        	printf("mount : %s\n",dst_dmesg);
        	if( mount_nfs(dst_dmesg,0) != 0)
        	{
        	    printf("mount nfs failed! file:%s\n",dst_dmesg);
        	    exit(1);
        	}

        	printf("ready to copy file %s to nfs nfs://%s/%s%s\n",dst_dmesg,url->server,url->path,dst_dmesg);
        	//TODO copy file
        	off = nfs_copy(fd,st.st_size,dst_dmesg);
        	if(off >= st.st_size)
        	{
        	    printf("succeed to copy file %s/%s/* to %s\n",dirpath, direntp->d_name,tmp);
        	    snprintf(skip, sizeof(skip), "%s/%s/%s",dirpath, direntp->d_name, UPLOAD_FILE);
        	    n = open(skip, O_CREAT | O_WRONLY, 0644);
        	    close(n);
        	}
        	printf("copied %d bytes\n", (int)off);
		}

    }

    closedir(dirp);
}

void deckey(char *str)
{
    char *p = str;

    while (*p) {
        if (*p >= 'A' && *p <= 'Z') *p += 32;
        else if (*p >= 'a' && *p <= 'z') *p -= 32;

        p++;
    }
}

void parse_config(char *conf)
{
#define SET_STRING(name, key, val) if (strcmp(#name, key)==0)           \
                snprintf(gconf.name, sizeof(gconf.name), "%s", val);
#define SET_INT(name, key, val) if(strcmp(#name, key)==0)               \
                gconf.name = atoi(val);

    char *end, *key, *val;
    key = conf;

    while (key) {
        end = strchr(key, '\n');

        if (end)
            *end++ = '\0';

        val = strchr(key, '=');

        if (val) {
            *val++ = '\0';
            trim_string(key, ' ');
            trim_string(key, '\t');
            SET_STRING(nfs_ip, key, val);
            SET_STRING(nfs_dir, key, val);
        }

        key = end;
    }

#undef SET_STRING
#undef SET_INT
}

int split_column(char *buffer, char **column, int size)
{
    int idx = 0;
    char *p = buffer;

    column[idx++] = p;

    while (*p && idx < size) {
        if (*p == ' ' || *p == '\n') {
            *p++ = '\0';
            column[idx++] = p;
        }

        p++;
    }

    return idx;
}


void scan_vmcore()
{
    FILE *fp;
    char *column[16];
    char buffer[1024];
    char tmpdir[256];
    int cnt, i;


    fp = fopen(MOUNT_INFO_FILE, "rb");
    memset(buffer, 0, sizeof(buffer));

    while (fgets(buffer, sizeof(buffer), fp)) {
        cnt = split_column(buffer, column, 16);

        for (i = 0; i < cnt; i++) {
            if (memcmp(column[i], "-", 2) == 0)
                break;
        }

        if (i < 5 || i + 2 >= cnt)
            continue;

        if (memcmp(column[i + 2], "/dev/", 5))
            continue;

        trim_string(column[4], '/');
        snprintf(tmpdir, sizeof(tmpdir), "%s%s", column[4], gconf.crashdir);
        ERR_LOG("DISK: %s %s, crashdir: %s\n", column[i + 2], column[4], tmpdir);
        check_dir(tmpdir);
    }

    fclose(fp);

}



char *get_conf_text()
{
    int fd;
    char *ret;
    struct stat st;

    fd = open(CONF_FILE_1, O_RDONLY);

    if (fd < 0)
        return NULL;

    fstat(fd, &st);
    ret = (char *)malloc(st.st_size + 1);

    if (ret) {
        read(fd, ret, st.st_size);
        ret[st.st_size] = '\0';
    }

    close(fd);

    return ret;
}

static void parse_local_conf()
{
        char *conf;
        if ((conf = get_conf_text()) != NULL) {
                parse_config(conf);
                free(conf);
        }
}

int run_loop()
{
    ERR_LOG("START.\n");

    parse_local_conf();
    scan_vmcore();

    ERR_LOG("END.\n");
    return 0;
}

void get_crash_dir()
{
    const char *fstype = "path ";
    FILE *fp;
    char *p;
    char buffer[256];

    fp = fopen("/etc/kdump.conf", "rb");

    if (!fp)
        return;

    while (fgets(buffer, sizeof(buffer), fp)) {
        if (memcmp(buffer, fstype, strlen(fstype)) != 0)
            continue;

        p = strchr(buffer, '\n');

        if (p != NULL)
            *p = '\0';

        snprintf(gconf.crashdir, sizeof(gconf.crashdir),
             "%s", buffer + strlen(fstype));
        break;
    }

    fclose(fp);
}

void init_default()
{
//#define PR_CONF(key, args...) snprintf(gconf.key, sizeof(gconf.key), ##args)
    char tmp[256];
    uint32_t ip = get_local_addr();
    uint8_t *arr = (uint8_t *)&ip;

    memset(&gconf, 0, sizeof(gconf));
    gconf.fp = stdout;
    PR_CONF(crashdir, CRASH_DIR);
    //PR_CONF(bucket_name, "kernel-khotfix");
    //PR_CONF(endpoint, "cn-hangzhou.oss.aliyun-inc.com");

    if (ip)
        PR_CONF(hostname, "%d.%d.%d.%d", arr[0], arr[1], arr[2], arr[3]);
    else if (gethostname(tmp, sizeof(tmp)) == 0)
        PR_CONF(hostname, "%s", tmp);
    else
        PR_CONF(hostname, "hostname");

    get_crash_dir();
}



void main_destroy()
{

    if (gconf.fp != stdout)
        fclose(gconf.fp);

    if (glockfd >= 0)
        close(glockfd);

}

void check_flock()
{
    int ret = -1;

    glockfd = open(LOCK_FILE, O_CREAT | O_RDWR, 0644);

    if (glockfd >= 0)
        ret = lockf(glockfd, F_TLOCK, 0);

    if (ret < 0) {
        printf("Lock failure: %s\n", LOCK_FILE);

        if (glockfd >= 0)
            close(glockfd);

        exit(1);
    }


}

int mount_nfs(char* dir, int is_dir)
{
    int err = 0;
    char nfs_url[512];
    sprintf(nfs_url,"nfs://%s/%s/%s",gconf.nfs_ip,gconf.nfs_dir,dir);
    nfs = nfs_init_context();
    int ret;
    if (nfs == NULL)
    {
        printf("failed to init context\n");
        err = -1;
        goto finished;
    }

    if ((url=nfs_parse_url_full(nfs, nfs_url)) == NULL)
    {
        printf("failed to parse url. %s\n",nfs_get_error(nfs));
        err = -1;
        goto finished;
    }

    if (nfs_mount(nfs, url->server, url->path) != 0)
    {
        printf("Failed to mount nfs share : %s\n", nfs_get_error(nfs));
        err = -1;
        goto finished;
    }

    if (is_dir == 1)
    {
        if(nfs_mkdir(nfs,url->file) != 0)
        {
            printf("Failed to mkdir : %s\n", url->file);
            err = -1;
            goto finished;
        }
    }
    else
    {
        if ((ret = nfs_open(nfs, url->file, 0600, &nfsfh)) != 0)
        {
            printf("failed to open %s and create now.\n", url->file);
            if((ret = nfs_create(nfs,url->file,O_WRONLY|O_CREAT|O_EXCL,0660,&nfsfh)) != 0)
            {
                printf("create new file %s failed.\n", url->file);
                err = -1;
                goto finished;
            }
        }
    }

    printf("succeed to mount to %s\n", nfs_url);

finished :
    nfs_destroy_url(url);
    if (nfs != NULL)
    {
        if (nfsfh)
        {
            nfs_close(nfs, nfsfh);
            nfsfh = NULL;
        }
        nfs_destroy_context(nfs);
    }
    return err;
}

int nfs_copy(int fd, int size, char* file)
{
    int off = 0;
    int count;
    char buf[BUFSIZE];
    char nfs_url[512];
    sprintf(nfs_url,"nfs://%s/%s/%s",gconf.nfs_ip,gconf.nfs_dir,file);
    nfs = nfs_init_context();
    int ret;
    if (nfs == NULL)
    {
        printf("failed to init context\n");
        off = -1;
        goto finished;
    }

    if ((url=nfs_parse_url_full(nfs, nfs_url)) == NULL)
    {
        printf("failed to parse url. %s\n",nfs_get_error(nfs));
        off = -1;
        goto finished;
    }

    if (nfs_mount(nfs, url->server, url->path) != 0)
    {
        printf("Failed to mount nfs share : %s\n", nfs_get_error(nfs));
        off = -1;
        goto finished;
    }
    if ((ret = nfs_open(nfs, url->file, 0600, &nfsfh)) != 0)
    {
        printf("failed to open %s and create now.\n", url->file);
    }

    while (off < size) {
        count = (size_t)(size - off);
        if (count > BUFSIZE) {
            count = BUFSIZE;
        }
        count = file_pread(fd, buf, count, off);
        if (count < 0) {
            fprintf(stderr, "Failed to read from source file\n");
            break;
        }
        count = file_pwrite(buf, count, off);
        if (count < 0) {
            fprintf(stderr, "Failed to write to dest file\n");
            break;
        }
    
        off += count;
    }
    close(fd);
finished :
    nfs_destroy_url(url);
    if (nfs != NULL)
    {
        if (nfsfh)
        {
            nfs_close(nfs, nfsfh);
            nfsfh = NULL;
        }
        nfs_destroy_context(nfs);
    }
    return off;
}

int main(int argc, char *argv[])
{
    init_default();
    check_flock();
    run_loop();
    main_destroy();
    return gerrcode;
}

