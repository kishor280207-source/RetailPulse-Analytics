import contextvars

_ip_address_var = contextvars.ContextVar("ip_address", default="unknown")
_user_agent_var = contextvars.ContextVar("user_agent", default="unknown")


def set_request_context(ip_address: str, user_agent: str):
    _ip_address_var.set(ip_address)
    _user_agent_var.set(user_agent)


def get_current_ip():
    return _ip_address_var.get()


def get_current_user_agent():
    return _user_agent_var.get()