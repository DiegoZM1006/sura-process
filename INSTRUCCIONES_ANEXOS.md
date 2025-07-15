# Instrucciones para Agregar Anexos a la Plantilla Word

## Ubicación del archivo
`public/docs/rce_daños.docx`

## Campos disponibles para docxtemplater:

### Anexos individuales (como lista):
```
{#anexos}
{numero}. {nombre} ({tipo} - {tamaño})
{/anexos}
```

### Anexos como texto plano:
```
{anexosAdicionales}
```

### Total de anexos:
```
Total de anexos: {totalAnexos}
```

## Cómo agregar en Word:

1. Abrir `public/docs/rce_daños.docx` en Microsoft Word
2. Ir a la sección "ANEXOS"
3. Después del anexo 4, agregar:

```
{anexosAdicionales}
```

4. Guardar el archivo

## Ejemplo de resultado:
```
ANEXOS

1. Aviso de siniestro de póliza XXXXXXXXXX expedida por Seguros Generales Sura S.A.
2. Registro fotográfico dispuesto en el Artículo 16 de la Ley 2251 del 2022 / IPAT.
3. Constancia de pago de daños materiales del vehículo asegurado por Sura S.A.
4. Copia simple de la Escritura Pública No. 392 del 12 de abril de 2016.

5. foto_accidente.jpg (Imagen - 2.45 MB)
6. cotizacion_reparacion.pdf (Documento - 1.2 MB)
```

## Variables disponibles:
- `{anexosAdicionales}` - Lista completa de anexos como texto
- `{totalAnexos}` - Número total de anexos (estándar + subidos)
- `{#anexos}{numero}`, `{nombre}`, `{tipo}`, `{tamaño}` `{/anexos}` - Loop de anexos individuales
