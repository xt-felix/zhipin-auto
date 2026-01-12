from django.db import models
import json


class User(models.Model):
    """用户配置表"""
    phone = models.CharField(max_length=20, unique=True, db_index=True, verbose_name='手机号')
    config = models.JSONField(null=True, blank=True, verbose_name='用户配置')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'users'
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.phone


class DeviceFingerprint(models.Model):
    """设备指纹表"""
    fingerprint = models.CharField(max_length=64, unique=True, db_index=True, verbose_name='设备指纹')
    phone = models.CharField(max_length=20, null=True, blank=True, db_index=True, verbose_name='关联手机号')
    ai_trial_start = models.DateField(null=True, blank=True, verbose_name='AI试用开始时间')
    ai_trial_end = models.DateField(null=True, blank=True, verbose_name='AI试用结束时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'device_fingerprints'
        verbose_name = '设备指纹'
        verbose_name_plural = '设备指纹'

    def __str__(self):
        return self.fingerprint


class UsageStats(models.Model):
    """使用统计表"""
    fingerprint = models.CharField(max_length=64, null=True, blank=True, db_index=True, verbose_name='设备指纹')
    phone = models.CharField(max_length=20, null=True, blank=True, db_index=True, verbose_name='手机号')
    action_type = models.CharField(max_length=20, default='greeting', verbose_name='操作类型')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='创建时间')

    class Meta:
        db_table = 'usage_stats'
        verbose_name = '使用统计'
        verbose_name_plural = '使用统计'
        indexes = [
            models.Index(fields=['fingerprint']),
            models.Index(fields=['phone']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.action_type} - {self.created_at}"
