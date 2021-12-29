CFLAGS=-Wall -g -O3  -Ithird_party/libnfs/include/nfsc  -Ithird_party/libnfs/include -Ithird_party/libnfs/mount 
LIBS=-lpthread
NAME=vmcore_collect
NFS_LIB=third_party/libnfs.a
VER=$(shell git log --pretty=format:%h -1)
DT=$(shell date '+%Y%m%d')
DEF=-DCOMMIT_ID="\"$(VER)|$(DT)\""
all: 
	make -C third_party 
	gcc $(CFLAGS) $(DEF) -o $(NAME) $(NAME).c $(NFS_LIB) ${LIBS} 

clean:
	rm -f $(NAME) 
	make -C third_party clean
