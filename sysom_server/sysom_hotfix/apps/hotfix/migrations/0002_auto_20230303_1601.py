# Generated by Django 3.2.16 on 2023-03-03 08:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hotfix', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='kernelversionmodel',
            name='git_branch',
        ),
        migrations.RemoveField(
            model_name='ostypemodel',
            name='git_repo',
        ),
        migrations.AddField(
            model_name='kernelversionmodel',
            name='source',
            field=models.CharField(default='', max_length=255, verbose_name='源码来源'),
        ),
        migrations.AddField(
            model_name='ostypemodel',
            name='source_repo',
            field=models.CharField(default='', max_length=255, verbose_name='源码仓库地址'),
        ),
        migrations.AddField(
            model_name='ostypemodel',
            name='src_pkg_mark',
            field=models.BooleanField(default=0, verbose_name='是否使用src包'),
        ),
        migrations.AlterField(
            model_name='hotfixmodel',
            name='hotfix_name',
            field=models.CharField(default='hotfix', max_length=255, verbose_name='补丁名称'),
        ),
    ]
