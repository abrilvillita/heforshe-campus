# HeForShe · Entre nos: propuesta y estado de trabajo

Campus Laguna · Torreón, Coahuila. Preparado el 9 de septiembre de 2026.

## La decisión principal

Conservar el diseño aprobado y convertirlo en una plataforma editorial. El sitio público no necesita cuentas de visitantes. Las cinco integrantes sí tendrán cuentas individuales, con acceso protegido y una o más responsables de publicación. Comprar un dominio no obliga a publicar el repositorio: el código puede seguir privado.

La versión de trabajo permite probar la nueva logística. La base de servidor está escrita, pero todavía no existen una base de datos remota, almacenamiento conectado, cuentas de editoras ni una configuración de dominio en este proyecto. No debe presentarse como una plataforma de producción ya protegida.

## Qué administra el equipo

| Apartado | Uso |
| --- | --- |
| Portada | Cambiar «una nota para ti», campus, fecha fundacional, anuncio y enlaces sociales. |
| Publicaciones | Crear contenido de cualquier sección, preparar borradores, revisar, publicar, editar y recuperar de papelera. |
| Periódico | Crear ediciones numeradas, fechas, páginas y bloques; conservar el archivo de generaciones. |
| Eventos | Editar inicio, fin, lugar, descripción y enlace de registro. Retirar eventos desde papelera. |
| Generaciones | Mantener periodos, integrantes, cargos, fotografías y enlaces autorizados. |
| Redes | Elegir publicaciones destacadas manualmente. Las cuentas del taller se cambian en Portada. |
| Juegos | Configurar preguntas y memoramas, fechas de actividad e invitaciones al entrar que se pueden omitir. |
| Buzón | Leer y archivar sugerencias privadas del taller. |

«Publicación» evita confundir el contenido editorial con el mensaje de bienvenida. «Periódico» es el archivo de ediciones con varias páginas. La fecha fundacional se mantiene; cada edición lleva su propia fecha.

VIVE incluye Arte y Cultura, Athletics, Grupos Estudiantiles, eSports e Impacto Social. La propuesta añade HeForShe, Educación en campus, Comunicación, Eventos y El mundo; todas las secciones se pueden editar. Presidencia conviene como cargo/firma, no como categoría obligatoria. [Tecmilenio](https://www.tecmilenio.mx/es/preguntas-frecuentes)

## Editor y Canva

El editor actual trabaja por bloques: encabezados, texto, citas, imágenes, video, enlaces, formularios admitidos, Canva y separadores. Permite fuente, tamaño, negrita, cursiva, color, fondo, alineación, espacio y ancho completo/mitad/tercio. En móvil los bloques se apilan. El formato se aplica al bloque completo; todavía no hay edición tipográfica por selección de palabras, lienzo libre, arrastre de elementos o colaboración simultánea al estilo Canva.

Para Canva, recomiendo empezar con exportaciones PNG/JPG/WebP y videos MP4. Su apariencia se conserva; si se requiere cambiar el texto dentro de la imagen, se cambia el diseño en Canva y se vuelve a exportar. El enlace público de visualización también puede incrustarse en los formatos admitidos, sujeto a sus permisos. No se aceptan scripts ni HTML arbitrario pegado en el editor.

La conexión automática con Canva es posible mediante OAuth y Connect APIs, con exportaciones que la aplicación debe guardar en su almacenamiento: sus enlaces de descarga caducan a las 24 horas. Las integraciones públicas requieren revisión; las privadas están asociadas a Canva Enterprise. No equivale a importar cada capa de Canva como bloques editables del blog. PDF como edición adjunta, importación por API y renovación de permisos quedan para la siguiente implementación. [Canva Connect](https://www.canva.dev/docs/connect/) · [Exportaciones](https://www.canva.dev/docs/connect/api-reference/exports/create-design-export-job/)

## Instagram y TikTok

Perfiles confirmados: [Instagram](https://www.instagram.com/heforshe_laguna/) y [TikTok](https://www.tiktok.com/@heforshe2025). El panel permite modificarlos y agregar otras redes.

Hoy están disponibles los enlaces de perfil y la selección manual de publicaciones con portada. No hay sincronización automática activada. Para ella necesitamos autorizar las cuentas, guardar tokens únicamente en servidor, renovarlos y consultar contenido reciente periódicamente. Una actualización cada 15–30 minutos sería una decisión de producto razonable para este taller, sujeta a límites y permisos; no sería «tiempo real» garantizado.

TikTok Display API ofrece información del perfil y listado de videos públicos recientes con los permisos correspondientes. Su reproductor admite parámetros y mensajes, pero la reproducción automática depende del navegador. No conviene prometer autoplay silencioso universal; habrá alternativa de reproducir/abrir. [Display API](https://developers.tiktok.com/docs/en/display-api-overview) · [Reproductor](https://developers.tiktok.com/docs/en/embed-player)

Instagram API con Instagram Login se dirige a cuentas profesionales, Business o Creator. El acceso a publicaciones/historias debe validarse para la cuenta y permisos concretos; no se debe asumir que cualquier perfil público permite obtener todo. No incluimos Stories como compromiso de lanzamiento. Tampoco se solicita acceso a mensajes privados para mostrar un feed. [Colección oficial de Meta](https://www.postman.com/meta/instagram/folder/1z5vxzu/instagram-api-with-instagram-login)

## Infraestructura recomendada

- **GitHub privado:** código, historial y revisión. Un dominio público no requiere hacer público el código.
- **Cloudflare Workers:** recibe las solicitudes y comprueba quién puede publicar. Sí se necesita lógica de servidor aunque no se consumieran APIs externas: publicar contenido y recibir sugerencias ya requiere una API propia.
- **D1:** contenido, configuraciones, sugerencias, historial de acciones y control de cambios simultáneos.
- **R2 privado:** archivos multimedia. Se sirven solo si pertenecen a contenido publicado o si la persona tiene autorización editorial.
- **Cloudflare Access:** acceso del equipo y MFA obligatorio mediante la política configurada. No guardamos cinco contraseñas dentro del código.
- **Turnstile:** comprobación contra automatizaciones del buzón, validada en servidor, con límites de envío.
- **Dominio y DNS:** identidad pública. HTTPS, Search Console y metadatos se revisan al lanzarlo.

No hace falta contratar un VPS y administrarlo manualmente para esta etapa. La propuesta usa servicios administrados. Hay límites y costos distintos para ejecución y archivos. Workers ofrece un plan gratuito limitado y un plan de pago desde USD 5/mes, pero eso no es una cotización total: revisar D1, R2, Access, dominio y consumo antes de activar servicios. No se ha comprado ni contratado nada. [Workers](https://developers.cloudflare.com/workers/platform/pricing/) · [Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)

## Seguridad, continuidad y anonimato

Las comprobaciones implementadas incluyen firma/expiración/emisor/audiencia de identidad, lista de cuentas autorizadas, funciones de editora y publicadora, validación de datos, control de origen, consultas parametrizadas, límites de tamaño, ausencia de HTML arbitrario y rechazo de sobrescrituras antiguas. Hay pruebas automatizadas de accesos rechazados, borradores privados y modificaciones simultáneas.

Access debe configurarse con MFA y cuentas individuales. Es posible exigir segundo factor independiente, incluidas llaves de seguridad y autenticadores; no basta con tener la función disponible. La renovación de generación requiere retirar cuentas salientes y verificar la recuperación de las nuevas. [MFA de Access](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/independent-mfa/)

Texto público del buzón propuesto: «Ideas, preguntas y sugerencias para mejorar el taller. No incluyas nombres ni datos personales. Este buzón no atiende emergencias ni ofrece acompañamiento profesional». Las sugerencias no aparecen públicamente. La aplicación no pide identidad ni guarda IP en el mensaje. El proveedor puede procesar metadatos de conexión; no se promete anonimato técnico absoluto. La retención propuesta es de 90 días para mensajes y unas dos horas para claves temporales de limitación. Tecmilenio debe revisar el aviso y el protocolo final.

La revisión automática inicial de dependencias reportó avisos pendientes. Antes de abrir al público hay que completar esa revisión, hacer pruebas en el entorno real, revisar respaldos y ensayar recuperación. La base no debe describirse como invulnerable ni certificada.

## Calendario y notificaciones

En esta versión «Recordármelo» descarga un archivo de calendario con inicio, fin, lugar y alarma un día antes. No exige registro. Hay que importarlo y permitir los avisos en el calendario del dispositivo. Cambios o cancelaciones posteriores no actualizan archivos ya importados.

Para la siguiente etapa: calendario por suscripción con identificadores estables y revisiones; filtros por tipo/campus, cupos y estados cancelado/reprogramado. Las notificaciones web requieren permiso del navegador, almacenar suscripciones, un service worker del navegador y un servicio de entrega con tareas programadas. Ese service worker es distinto del Worker de Cloudflare. No es necesario pedir un registro completo para ello.

## Juegos y experiencia

Disponibles dos plantillas reutilizables: pregunta con reflexión y memorama de palabras. El equipo cambia el contenido y las fechas desde el panel. Las invitaciones al entrar aparecen una vez por sesión y tienen «Ahora no». No se cargan juegos externos arbitrarios ni código pegado por editoras.

Podemos agregar después clasificación de conductas y escenarios con decisiones. Evitar diagnósticos, puntuaciones que etiqueten a las personas, rankings públicos o recompensas por compartir situaciones sensibles. No hace falta introducir una dinámica nueva todos los días: mejor pocos juegos claros y buenos durante campañas específicas.

## Para llevarlo a administración central

El valor de la propuesta es dar continuidad entre generaciones, conservar memoria institucional, facilitar publicaciones accesibles y convertir las redes en una puerta hacia contenido organizado. No requiere recopilar perfiles de todo el alumnado.

Antes de ampliar a otros campus, definir titularidad del dominio y cuentas, responsables de moderación, consentimiento de imágenes, uso de marcas y un protocolo de salida/relevo. El modelo actual es de un campus; aislamiento y permisos por campus, administración central y reportes institucionales requieren otra etapa. No se debe ofrecer como multicampus ya implementado.

## Qué falta aportar o decidir

1. Dominio elegido y cuenta responsable de renovarlo.
2. Cuenta de Cloudflare y autorización para activar los recursos; los costos se revisan antes.
3. Correos de las cinco integrantes y quiénes serán publicadoras. No mandar contraseñas.
4. Fotografías autorizadas, nombres/cargos y periodo de generación.
5. Primeras publicaciones y edición real del periódico.
6. Tipo de cuenta profesional de Instagram y responsables para autorizar ambas redes.
7. Responsable institucional de contenido, privacidad y seguridad; confirmar uso de marcas.
8. Enlace exacto de Forge. No se identificó con suficiente certeza la referencia de las dos generaciones, por lo que no se atribuye ningún diseño a ese sitio.

Para Google todavía falta dotar a cada publicación/edición de URL propia, metadatos, sitemap y renderizado/pre-renderizado adecuado. Comprar dominio no garantiza indexación. La vista de trabajo abre artículos en ventanas de lectura, no en rutas indexables individuales. [Guía de Google](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
