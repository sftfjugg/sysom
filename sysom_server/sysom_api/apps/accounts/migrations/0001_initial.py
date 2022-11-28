# Generated by Django 3.2.8 on 2022-11-28 06:37

from django.db import migrations, models
import django.db.models.deletion
import lib.utils


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('deleted_at', models.CharField(max_length=20, null=True)),
                ('username', models.CharField(max_length=128)),
                ('password', models.CharField(max_length=255)),
                ('is_admin', models.BooleanField(default=False)),
                ('is_agree', models.BooleanField(default=False)),
                ('description', models.TextField()),
            ],
            options={
                'db_table': 'sys_users',
            },
        ),
        migrations.CreateModel(
            name='Permission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('deleted_at', models.CharField(max_length=20, null=True)),
                ('path', models.CharField(max_length=64, verbose_name='Api路径')),
                ('method', models.IntegerField(choices=[(0, 'GET'), (1, 'POST'), (2, 'DELETE'), (3, 'PUT'), (4, 'PATCH')], default=0, verbose_name='请求方式')),
            ],
            options={
                'db_table': 'sys_permission',
            },
        ),
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('deleted_at', models.CharField(max_length=20, null=True)),
                ('role_name', models.CharField(max_length=128, unique=True, verbose_name='角色名称')),
                ('permissions', models.ManyToManyField(db_constraint=False, to='accounts.Permission', verbose_name='关联权限')),
            ],
            options={
                'db_table': 'sys_role',
            },
        ),
        migrations.CreateModel(
            name='HandlerLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('deleted_at', models.CharField(max_length=20, null=True)),
                ('request_ip', models.GenericIPAddressField(verbose_name='请求IP地址')),
                ('request_url', models.CharField(max_length=64, verbose_name='请求API路径')),
                ('request_browser_agent', models.CharField(max_length=256, verbose_name='浏览器信息')),
                ('request_method', models.CharField(choices=[('get', 'GET'), ('post', 'POST'), ('put', 'PUT'), ('patch', 'PATCH'), ('delete', 'DELETE')], default='get', max_length=32, verbose_name='请求方式')),
                ('handler_view', models.CharField(max_length=32, verbose_name='处理视图')),
                ('response_status', models.IntegerField(default=200, verbose_name='响应时间')),
                ('request_option', models.IntegerField(choices=[(0, 'login'), (1, 'action')], default=1, verbose_name='请求动作')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='option_logs', to='accounts.user', verbose_name='操作人')),
            ],
            options={
                'verbose_name': '操作日志',
                'verbose_name_plural': '操作日志',
                'db_table': 'sys_handler_log',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.ManyToManyField(db_constraint=False, to='accounts.Role', verbose_name='关联角色'),
        ),
    ]
