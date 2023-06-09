import os

env = os.environ.get("env", "product")


if env == "develop":
    from conf.develop import *
elif env == "testing":
    from conf.testing import *
elif env == "product":
    from conf.product import *

# 跨域允许
if DEBUG:
    CORS_ORIGIN_ALLOW_ALL = True
