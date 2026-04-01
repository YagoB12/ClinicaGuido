using System;
using Newtonsoft.Json;
using System.Globalization;

namespace ProyectoAnalisisClinica.Converters
{
    public class TimeOnlyJsonConverter : JsonConverter<TimeOnly>
    {
        private const string Format = "HH:mm:ss";

        public override void WriteJson(JsonWriter writer, TimeOnly value, JsonSerializer serializer)
        {
            writer.WriteValue(value.ToString(Format, CultureInfo.InvariantCulture));
        }

        public override TimeOnly ReadJson(JsonReader reader, Type objectType, TimeOnly existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.String && reader.Value != null)
            {
                var timeStr = reader.Value.ToString();

                if (TimeOnly.TryParse(timeStr, out var time))
                    return time;
            }

            return default;
        }
    }
}
