# Generated by Django 3.2.16 on 2023-01-10 09:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('task', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobmodel',
            name='code',
            field=models.IntegerField(default=0, verbose_name='诊断执行状态码'),
        ),
        migrations.AddField(
            model_name='jobmodel',
            name='err_msg',
            field=models.TextField(default='', verbose_name='诊断错误信息'),
        ),
    ]
