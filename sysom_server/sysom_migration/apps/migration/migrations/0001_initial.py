# Generated by Django 3.2.16 on 2022-11-29 13:34

from django.db import migrations, models
import lib.utils


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='MigImpInfoModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('updated_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='更新时间')),
                ('ip', models.CharField(max_length=100, unique=True, verbose_name='ip')),
                ('mig_info', models.JSONField(default=dict, verbose_name='迁移配置')),
                ('old_info', models.JSONField(default=dict, verbose_name='迁移前信息')),
                ('new_info', models.JSONField(default=dict, verbose_name='迁移后信息')),
                ('cmp_info', models.JSONField(default=dict, verbose_name='迁移对比')),
                ('log', models.TextField(verbose_name='实施日志')),
                ('report', models.TextField(verbose_name='实施报告')),
            ],
            options={
                'db_table': 'mig_implementation_info',
            },
        ),
        migrations.CreateModel(
            name='MigImpModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('updated_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='更新时间')),
                ('cluster_id', models.IntegerField(verbose_name='cluster id')),
                ('hostname', models.CharField(max_length=100, verbose_name='hostname')),
                ('ip', models.CharField(max_length=100, unique=True, verbose_name='ip')),
                ('version', models.CharField(max_length=100, verbose_name='系统版本')),
                ('status', models.CharField(default='waiting', max_length=32, verbose_name='迁移实施状态')),
                ('rate', models.IntegerField(default=0, verbose_name='迁移实施进度')),
            ],
            options={
                'db_table': 'mig_implementation',
            },
        ),
        migrations.CreateModel(
            name='MigJobModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('updated_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='更新时间')),
                ('ip', models.CharField(max_length=100, verbose_name='ip')),
                ('mig_id', models.CharField(max_length=32, verbose_name='任务ID')),
                ('mig_type', models.CharField(max_length=32, verbose_name='任务类型')),
                ('job_name', models.CharField(max_length=32, verbose_name='名称')),
                ('job_data', models.JSONField(default=dict, verbose_name='参数')),
                ('job_status', models.CharField(default='running', max_length=32, verbose_name='状态')),
                ('job_result', models.JSONField(default=dict, verbose_name='结果')),
            ],
            options={
                'db_table': 'mig_job',
            },
        ),
    ]
