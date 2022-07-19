from rest_framework.viewsets import GenericViewSet

class CommonModelViewSet(GenericViewSet):
    """
    通用 ModelViewSet 实现，提供一些通用工具方法
    """
    def require_param_validate(self, request, require_params):
        """
        @param request => HTTP 请求
        @param 
        """
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
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