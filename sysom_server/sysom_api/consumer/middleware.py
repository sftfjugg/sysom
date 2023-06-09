from channels.db import database_sync_to_async


@database_sync_to_async
def get_user(user_id: int):
    from apps.accounts.models import User
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return None
    return user


class AuthMiddleware:
    def __init__(self, application):
        self.application = application

    async def __call__(self, scope, receive, send, *args, **kwargs):
        if "headers" not in scope:
            raise ValueError(
                "CookieMiddleware was passed a scope that did not have a headers key "
                + "(make sure it is only passed HTTP or WebSocket connections)"
            )
        user_id = None
        query_string = scope.get('query_string', None)

        if not query_string:
            scope['user'] = None
        else:
            from lib.utils import url_format_dict
            query_string: dict = url_format_dict(query_string.decode('utf-8'))
            user_id = query_string.get('user_id', None)
            if not user_id:
                scope['user'] = None
            else:
                scope['user'] = await get_user(user_id=user_id)
                scope['query'] = query_string
        return await self.application(scope, receive, send, *args, **kwargs)
