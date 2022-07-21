from rest_framework.viewsets import GenericViewSet


class CommonModelViewSet(GenericViewSet):
    """
    通用 ModelViewSet 实现，提供一些通用工具方法
    """

    def require_param_validate(self, request, require_params):
        """
        检查请求参数中是否包含所需的所有参数，任何参数缺失将返回错误，错误信息中包含缺失的参数列表
        @param request => HTTP 请求
        @param require_params => 需要验证的参数列表，例如：['hostname', 'ip']
        """
        if request.method in ['POST', 'PATCH', 'DELETE']:
            context, missing_param_list = request.data, []
            for require_param in require_params:
                if require_param not in context:
                    missing_param_list.append(require_param)
            if len(missing_param_list) > 0:
                return {
                    "success": False,
                    "message": f"Missing parameters: {', '.join(missing_param_list)}"
                }
        return {
            "success": True,
            "message": ""
        }

    def extract_specific_params(self, request, params_list, require_all: bool = False):
        """
        从请求参数中提取 params_list 中指定的参数列表 => 最后将不在参数列表中的所有其它参数从参数列表中移除
        @param request => HTTP 请求
        @param params_list => 需要提取的参数列表，例如：['cluster']
        @param require_all => 是否所有参数都是必须的
                                True => 任何参数缺失都会返回错误
                                False => 对于每一个参数，有则提取，无则忽略 
        """
        if require_all:
            res = self.require_param_validate(request, params_list)
            if not res["success"]:
                return res
        if request.method in ['POST', 'PATCH', 'DELETE']:
            context, not_allow_params = request.data, []
            for key in context:
                if key not in params_list:
                    not_allow_params.append(key)
            for param_name in not_allow_params:
                context.pop(param_name)
                
        return {
            "success": True,
            "message": "",
        }
        