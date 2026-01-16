from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from datetime import timedelta
import json
from .models import User, DeviceFingerprint, UsageStats


# CORS响应头装饰器
def cors_headers(view_func):
    """添加CORS响应头"""
    def wrapper(request, *args, **kwargs):
        response = view_func(request, *args, **kwargs)
        if isinstance(response, JsonResponse):
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    return wrapper


@cors_headers
@require_http_methods(["GET", "OPTIONS"])
def getjson(request):
    """
    获取用户配置
    GET /getjson?phone=13800138000
    """
    if request.method == 'OPTIONS':
        return JsonResponse({})
    
    phone = request.GET.get('phone', '').strip()
    
    if not phone:
        return JsonResponse({
            'success': False,
            'error': '手机号不能为空'
        })
    
    try:
        user = User.objects.get(phone=phone)
        if user.config:
            # 将 JSON 字符串转换回对象
            config_obj = json.loads(user.config) if isinstance(user.config, str) else user.config
            return JsonResponse({
                'success': True,
                'config': config_obj
            })
        else:
            return JsonResponse({
                'success': False,
                'error': '未找到配置'
            })
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': '未找到用户配置'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


@csrf_exempt
@cors_headers
@require_http_methods(["POST", "OPTIONS"])
def updatejson(request):
    """
    保存用户配置
    POST /updatejson?phone=13800138000
    Body: JSON 配置内容
    """
    if request.method == 'OPTIONS':
        return JsonResponse({})

    phone = request.GET.get('phone', '').strip()

    if not phone:
        return JsonResponse({
            'success': False,
            'error': '手机号不能为空'
        })

    try:
        config_data = json.loads(request.body)

        # 将配置转为 JSON 字符串存储（因为使用 TextField）
        config_str = json.dumps(config_data, ensure_ascii=False)

        # 使用update_or_create实现UPSERT
        user, created = User.objects.update_or_create(
            phone=phone,
            defaults={'config': config_str}
        )
        
        return JsonResponse({
            'success': True,
            'message': '配置已保存'
        })
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': '保存失败：数据格式错误'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'保存失败：{str(e)}'
        })


@cors_headers
@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def checkaitrial(request):
    """
    AI试用期管理
    GET  /checkaitrial?fingerprint=xxx  - 检查试用状态
    POST /checkaitrial?fingerprint=xxx  - 记录新设备，赠送试用期
    """
    if request.method == 'OPTIONS':
        return JsonResponse({})
    
    fingerprint = request.GET.get('fingerprint', '').strip()
    
    if not fingerprint:
        return JsonResponse({
            'success': False,
            'error': '设备指纹不能为空'
        })
    
    try:
        # AI试用期天数
        AI_TRIAL_DAYS = 3
        
        if request.method == 'GET':
            # 检查试用状态
            try:
                device = DeviceFingerprint.objects.get(fingerprint=fingerprint)
            except DeviceFingerprint.DoesNotExist:
                return JsonResponse({
                    'success': True,
                    'is_new': True,
                    'has_trial': False,
                    'message': '新设备，未开通试用'
                })
            
            today = timezone.now().date()
            trial_end = device.ai_trial_end
            
            if trial_end and trial_end >= today:
                days_left = (trial_end - today).days
                return JsonResponse({
                    'success': True,
                    'is_new': False,
                    'has_trial': True,
                    'trial_end': str(trial_end),
                    'days_left': days_left
                })
            else:
                return JsonResponse({
                    'success': True,
                    'is_new': False,
                    'has_trial': False,
                    'trial_end': str(trial_end) if trial_end else None,
                    'message': '试用期已过期'
                })
        
        elif request.method == 'POST':
            # 记录新设备并赠送试用期
            today = timezone.now().date()
            trial_end = today + timedelta(days=AI_TRIAL_DAYS)
            
            try:
                device = DeviceFingerprint.objects.get(fingerprint=fingerprint)
                # 设备已存在
                if device.ai_trial_end and device.ai_trial_end >= today:
                    return JsonResponse({
                        'success': False,
                        'error': '该设备已有试用期',
                        'trial_end': str(device.ai_trial_end)
                    })
                # 已过期，不再赠送
                return JsonResponse({
                    'success': False,
                    'error': '该设备试用期已使用过'
                })
            except DeviceFingerprint.DoesNotExist:
                # 新设备，赠送试用期
                DeviceFingerprint.objects.create(
                    fingerprint=fingerprint,
                    ai_trial_start=today,
                    ai_trial_end=trial_end
                )
                return JsonResponse({
                    'success': True,
                    'message': f'已赠送 {AI_TRIAL_DAYS} 天试用期',
                    'trial_start': str(today),
                    'trial_end': str(trial_end)
                })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


@cors_headers
@require_http_methods(["GET", "OPTIONS"])
def checkfingerprint(request):
    """
    检查设备与手机号绑定关系
    GET /checkfingerprint?fingerprint=xxx&phone=xxx
    """
    if request.method == 'OPTIONS':
        return JsonResponse({})
    
    fingerprint = request.GET.get('fingerprint', '').strip()
    phone = request.GET.get('phone', '').strip()
    
    if not fingerprint:
        return JsonResponse({
            'success': False,
            'error': '设备指纹不能为空'
        })
    
    try:
        try:
            device = DeviceFingerprint.objects.get(fingerprint=fingerprint)
        except DeviceFingerprint.DoesNotExist:
            return JsonResponse({
                'success': True,
                'is_bound': False,
                'message': '设备未绑定'
            })
        
        if device.phone:
            if phone and device.phone == phone:
                return JsonResponse({
                    'success': True,
                    'is_bound': True,
                    'is_current_user': True,
                    'message': '设备已绑定到当前手机号'
                })
            else:
                # 脱敏处理手机号
                masked_phone = device.phone[:3] + '****' + device.phone[-4:] if len(device.phone) >= 7 else '****'
                return JsonResponse({
                    'success': True,
                    'is_bound': True,
                    'is_current_user': False,
                    'bound_phone': masked_phone,
                    'message': '设备已绑定到其他手机号'
                })
        else:
            return JsonResponse({
                'success': True,
                'is_bound': False,
                'message': '设备存在但未绑定手机号'
            })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })


@cors_headers
@require_http_methods(["GET", "OPTIONS"])
def counter(request):
    """
    使用统计 - 每次打招呼时调用
    GET /counter?fingerprint=xxx&phone=xxx
    """
    if request.method == 'OPTIONS':
        return JsonResponse({})
    
    fingerprint = request.GET.get('fingerprint', '').strip()
    phone = request.GET.get('phone', '').strip()
    
    try:
        UsageStats.objects.create(
            fingerprint=fingerprint if fingerprint else None,
            phone=phone if phone else None,
            action_type='greeting'
        )
        return JsonResponse({
            'success': True,
            'message': '统计成功'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })
