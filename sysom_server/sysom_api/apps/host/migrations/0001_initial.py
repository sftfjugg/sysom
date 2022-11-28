# Generated by Django 3.2.8 on 2022-11-28 06:46

from django.db import migrations, models
import django.db.models.deletion
import lib.utils


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Cluster',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('deleted_at', models.CharField(max_length=20, null=True)),
                ('cluster_name', models.CharField(max_length=128, unique=True)),
                ('cluster_description', models.CharField(default='', max_length=255)),
            ],
            options={
                'db_table': 'sys_cluster',
            },
        ),
        migrations.CreateModel(
            name='HostModel',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
                ('deleted_at', models.CharField(max_length=20, null=True)),
                ('hostname', models.CharField(max_length=100, unique=True)),
                ('ip', models.CharField(max_length=100, unique=True)),
                ('port', models.IntegerField()),
                ('username', models.CharField(max_length=100)),
                ('private_key', models.TextField(null=True)),
                ('description', models.CharField(max_length=255, null=True)),
                ('status', models.IntegerField(choices=[(0, 'running'), (1, 'error'), (2, 'offline')], default=2, verbose_name='主机状态')),
                ('client_deploy_cmd', models.TextField(default='', verbose_name='client部署命令')),
                ('created_by', models.IntegerField(verbose_name='创建用户')),
                ('cluster', models.ForeignKey(default='', on_delete=django.db.models.deletion.CASCADE, related_name='hosts', to='host.cluster')),
            ],
            options={
                'db_table': 'sys_host',
            },
        ),
    ]
