# Generated by Django 3.2.16 on 2022-12-19 06:53

from django.db import migrations, models
import lib.utils


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='MigAssModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('updated_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='更新时间')),
                ('hostname', models.CharField(max_length=100, verbose_name='hostname')),
                ('ip', models.CharField(max_length=100, verbose_name='ip')),
                ('old_ver', models.CharField(max_length=100, verbose_name='当前版本')),
                ('new_ver', models.CharField(max_length=100, verbose_name='评估版本')),
                ('rate', models.IntegerField(default=0, verbose_name='评估进度')),
                ('status', models.CharField(default='running', max_length=32, verbose_name='评估状态')),
                ('detail', models.TextField(verbose_name='评估详情')),
                ('config', models.TextField(verbose_name='评估配置')),
                ('imp_report', models.TextField(verbose_name='风险评估报告')),
                ('sys_config', models.TextField(verbose_name='系统评估报告')),
                ('hard_info', models.TextField(verbose_name='整机信息')),
                ('hard_result', models.TextField(verbose_name='板卡评估')),
                ('app_config', models.TextField(verbose_name='应用评估报告')),
            ],
            options={
                'db_table': 'mig_assessment',
                'ordering': ['-id'],
            },
        ),
        migrations.CreateModel(
            name='MigImpModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('updated_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='更新时间')),
                ('ip', models.CharField(max_length=100, verbose_name='ip')),
                ('status', models.CharField(default='waiting', max_length=32, verbose_name='实施状态')),
                ('step', models.IntegerField(default=0, verbose_name='实施步骤')),
                ('detail', models.TextField(verbose_name='步骤详情')),
                ('rate', models.IntegerField(default=0, verbose_name='实施进度')),
                ('config', models.TextField(verbose_name='实施配置')),
                ('old_ver', models.CharField(max_length=100, verbose_name='迁移前版本')),
                ('new_ver', models.CharField(max_length=100, verbose_name='迁移后版本')),
                ('old_info', models.TextField(verbose_name='迁移前信息')),
                ('new_info', models.TextField(verbose_name='迁移后信息')),
                ('mig_info', models.TextField(verbose_name='迁移配置')),
                ('mig_step', models.TextField(verbose_name='迁移步骤')),
                ('ass_log', models.TextField(verbose_name='实施日志')),
                ('ass_report', models.TextField(verbose_name='实施日志')),
                ('imp_log', models.TextField(verbose_name='实施日志')),
                ('imp_report', models.TextField(verbose_name='实施日志')),
                ('cmp_info', models.TextField(verbose_name='迁移对比')),
            ],
            options={
                'db_table': 'mig_implementation',
                'ordering': ['-id'],
            },
        ),
        migrations.CreateModel(
            name='MigJobModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('updated_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='更新时间')),
                ('ip', models.CharField(max_length=100, verbose_name='ip')),
                ('mig_id', models.CharField(max_length=32, verbose_name='迁移ID')),
                ('mig_type', models.CharField(max_length=32, verbose_name='迁移类型')),
                ('job_name', models.CharField(max_length=32, verbose_name='名称')),
                ('job_data', models.TextField(verbose_name='参数')),
                ('job_status', models.CharField(default='running', max_length=32, verbose_name='状态')),
                ('job_result', models.TextField(verbose_name='结果')),
            ],
            options={
                'db_table': 'mig_job',
                'ordering': ['-id'],
            },
        ),
    ]
