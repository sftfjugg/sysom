# Generated by Django 3.2.16 on 2023-02-02 09:25

from django.db import migrations, models
import lib.utils


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='HotfixModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('deleted_at', models.CharField(max_length=20, null=True)),
                ('arch', models.CharField(max_length=10, verbose_name='架构')),
                ('os_type', models.CharField(default='Anolis', max_length=50, verbose_name='操作系统类型')),
                ('kernel_version', models.CharField(max_length=60, verbose_name='内核版本')),
                ('patch_path', models.CharField(max_length=255, verbose_name='补丁路径')),
                ('patch_file', models.CharField(default='patch', max_length=255, verbose_name='patch名称')),
                ('hotfix_path', models.CharField(max_length=255, verbose_name='rpm存储路径')),
                ('hotfix_name', models.CharField(default='hotfix', max_length=255, unique=True, verbose_name='补丁名称')),
                ('building_status', models.IntegerField(default=0, verbose_name='构建状态')),
                ('hotfix_necessary', models.IntegerField(default=0, verbose_name='补丁重要性')),
                ('hotfix_risk', models.IntegerField(default=0, verbose_name='补丁风险')),
                ('description', models.CharField(default='NULL', max_length=300, verbose_name='描述')),
                ('log', models.TextField(default='', verbose_name='构建日志')),
                ('log_file', models.CharField(max_length=255, verbose_name='日志存储路径')),
                ('creator', models.CharField(default='admin', max_length=20, verbose_name='创建者')),
                ('formal', models.BooleanField(default=0, verbose_name='正式包')),
                ('rpm_package', models.CharField(max_length=255, verbose_name='rpm包名')),
            ],
            options={
                'db_table': 'sys_hotfix',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='KernelVersionModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('deleted_at', models.CharField(max_length=20, null=True)),
                ('kernel_version', models.CharField(max_length=60, verbose_name='内核版本')),
                ('os_type', models.CharField(max_length=25, verbose_name='操作系统类型')),
                ('git_branch', models.CharField(max_length=50, verbose_name='源码git分支')),
                ('devel_link', models.TextField(default='', verbose_name='devel包链接')),
                ('debuginfo_link', models.TextField(default='', verbose_name='debuginfo包链接')),
            ],
            options={
                'db_table': 'sys_hotfix_kernelversion',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='OSTypeModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('deleted_at', models.CharField(max_length=20, null=True)),
                ('os_type', models.CharField(max_length=25, verbose_name='操作系统类型')),
                ('git_repo', models.CharField(max_length=255, verbose_name='源码git仓库地址')),
                ('image', models.CharField(max_length=255, verbose_name='该系列的构建容器镜像')),
            ],
            options={
                'db_table': 'sys_hotfix_ostype',
                'ordering': ['-created_at'],
            },
        ),
    ]
