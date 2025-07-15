# Generación de Documentos Word con Docxtemplater

## Cómo funciona

Este sistema utiliza `docxtemplater` para generar documentos Word profesionales basados en plantillas predefinidas y datos del formulario.

## Plantillas disponibles

### 1. RCE Daños (`/public/docs/rce_daños.docx`)
- **Archivo:** `rce_daños.docx`
- **Uso:** Para casos de "RECLAMACION RCE DAÑOS"
- **Salida:** `RCE_Daños_YYYY-MM-DD.docx`

### 2. RCE Hurto (`/public/docs/rce_hurto.docx`)
- **Archivo:** `rce_hurto.docx`
- **Uso:** Para casos de "RECLAMACION RCE HURTO"
- **Salida:** `RCE_Hurto_YYYY-MM-DD.docx`

## Variables disponibles en las plantillas

### Datos básicos
- `{fechaHoy}` - Fecha actual en formato español (ej: "14 de julio del 2025")
- `{nombreRazonSocial}` - Nombre o razón social del asegurado
- `{nit}` - NIT del asegurado
- `{correo}` - Correo electrónico del asegurado

### Datos del accidente
- `{fechaAccidente}` - Fecha del accidente en formato español
- `{direccionSucedido}` - Dirección donde ocurrió el accidente
- `{ciudadSucedido}` - Ciudad donde ocurrió el accidente
- `{departamentoSucedido}` - Departamento donde ocurrió el accidente

### Vehículos involucrados
- `{placas1erImplicado}` - Placas del primer vehículo
- `{propietario1erVehiculo}` - Propietario del primer vehículo
- `{placas2doImplicado}` - Placas del segundo vehículo
- `{propietario2doVehiculo}` - Propietario del segundo vehículo

### Información del conductor
- `{conductorVehiculo}` - Nombre del conductor
- `{ccConductor}` - Cédula del conductor

### Información económica
- `{cuantias}` - Cuantías estimadas
- `{polizaAsegurado}` - Número de póliza del asegurado

## Cómo editar las plantillas

1. **Abrir la plantilla** en Microsoft Word
2. **Insertar variables** usando la sintaxis `{nombreVariable}`
3. **Guardar** el archivo manteniendo el formato `.docx`
4. **Ubicar** el archivo en `/public/docs/`

### Ejemplo de uso en Word:
```
El día {fechaAccidente} en la {direccionSucedido}, ciudad de {ciudadSucedido}, 
se presentó un accidente entre el vehículo de placas {placas1erImplicado} 
de propiedad de {propietario1erVehiculo} y el vehículo de placas {placas2doImplicado}.
```

## Valores por defecto

Si un campo está vacío en el formulario, se usarán valores por defecto para mantener el formato:
- Texto: `XXXXXXXXXXXXXXX`
- Números: `XXXXXXXX`
- Fechas: `XXX de XXXX del 2024`

## Características técnicas

- **Formato:** Microsoft Word (.docx)
- **Codificación:** UTF-8
- **Compatibilidad:** Word 2010+, LibreOffice, Google Docs
- **Tamaño máximo recomendado:** 10MB por plantilla
