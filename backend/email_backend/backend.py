import ssl
from django.utils.functional import cached_property
from django.core.mail.backends.smtp import EmailBackend as DjangoSMTPBackend


class EmailBackend(DjangoSMTPBackend):
    @cached_property
    def ssl_context(self):
        if self.ssl_certfile or self.ssl_keyfile:
            ssl_context = ssl.SSLContext(protocol=ssl.PROTOCOL_TLS_CLIENT)
            ssl_context.load_cert_chain(self.ssl_certfile, self.ssl_keyfile)
        else:
            ssl_context = ssl.create_default_context()

        # Python 3.14/OpenSSL may reject otherwise valid CA
        # certificates because of strict X.509 validation.
        if hasattr(ssl, "VERIFY_X509_STRICT"):
            ssl_context.verify_flags &= ~ssl.VERIFY_X509_STRICT

        return ssl_context
