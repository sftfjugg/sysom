# Generated by Django 3.2.16 on 2022-12-14 12:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('host', '0002_hostmodel_host_info'),
    ]

    operations = [
        migrations.AlterField(
            model_name='hostmodel',
            name='status',
            field=models.IntegerField(choices=[(0, 'running'), (1, 'error'), (2, 'offline'), (3, 'migrating')], default=2, verbose_name='主机状态'),
        ),
    ]