using System;
using Newtonsoft.Json;
using System.Globalization;

namespace ProyectoAnalisisClinica.Converters
{
    public class DateOnlyJsonConverter : JsonConverter<DateOnly>
    {
        private const string Format = "yyyy-MM-dd";

        public override void WriteJson(JsonWriter writer, DateOnly value, JsonSerializer serializer)
        {
            writer.WriteValue(value.ToString(Format, CultureInfo.InvariantCulture));
        }

        public override DateOnly ReadJson(JsonReader reader, Type objectType, DateOnly existingValue, bool hasExistingValue, JsonSerializer serializer)
        {
            if (reader.TokenType == JsonToken.String && reader.Value != null)
            {
                var dateStr = reader.Value.ToString();

                // Analiza sin aplicar UTC ni zona horaria
                if (DateTime.TryParseExact(dateStr, Format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                {
                    return DateOnly.FromDateTime(dt);
                }

                // Si viene como DateTime (ya con hora), quita la parte de hora y trata como local
                if (DateTime.TryParse(dateStr, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out dt))
                {
                    return DateOnly.FromDateTime(dt);
                }
            }

            return default;
        }
    }
}
