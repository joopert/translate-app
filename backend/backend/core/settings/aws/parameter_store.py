import json
from typing import Any, Literal, TypedDict, cast

from boto3 import Session
from pydantic.fields import FieldInfo
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
)


class SSMParameterResponse(TypedDict):
    Parameter: dict[Literal["Value"], str]


class SSMParameterStoreSettingsSource(PydanticBaseSettingsSource):
    """
    Pydantic settings source that reads settings from AWS SSM parameter store.
    The keys are case insensitive. Keys must be a string.
    """

    def __init__(self, settings_cls: type[BaseSettings]):
        super().__init__(settings_cls)
        self.params: dict[str, Any] = {}

    def get_params(self) -> dict[str, Any]:
        region = self.config.get("region")
        if region is None:
            region = "eu-west-1"

        session = Session(
            region_name=region,
        )

        client = session.client(
            service_name="ssm",
            region_name=region,
        )

        parameter_name = cast(str, self.config.get("ssm_parameter_name"))

        parameter_string = cast(
            SSMParameterResponse,
            client.get_parameter(Name=parameter_name, WithDecryption=True),
        )

        params = json.loads(parameter_string["Parameter"]["Value"])
        try:
            self.params = {k.lower(): v for k, v in params.items()}
        except AttributeError as e:
            raise ValueError("Parameter keys must be a string") from e
        return self.params

    def get_field_value(self, field: FieldInfo, field_name: str) -> tuple[Any, str, bool]:
        if not self.params:
            self.get_params()

        field_value = self.params.get(field_name.lower())
        return field_value, field_name, False

    def prepare_field_value(self, field_name: str, field: FieldInfo, value: Any, value_is_complex: bool) -> Any:
        return value

    def __call__(self) -> dict[str, Any]:
        d: dict[str, Any] = {}

        for field_name, field in self.settings_cls.model_fields.items():
            field_value, field_key, value_is_complex = self.get_field_value(field, field_name)
            field_value = self.prepare_field_value(field_name, field, field_value, value_is_complex)
            if field_value is not None:
                d[field_key] = field_value

        return d
