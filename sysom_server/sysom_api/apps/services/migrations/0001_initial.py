# Generated by Django 3.2.8 on 2022-11-29 08:33

from django.db import migrations, models
import lib.utils


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='ServiceInfo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('service_name', models.CharField(max_length=100, unique=True)),
                ('created_at', models.CharField(default=lib.utils.human_datetime, max_length=20, verbose_name='创建时间')),
            ],
            options={
                'db_table': 'sys_service_info',
            },
        ),
    ]
