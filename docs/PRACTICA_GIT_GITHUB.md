# Práctica: colaboración con Git y GitHub en minizon

**Fecha:** 8 de octubre de 2026.  
**Repositorio:** https://github.com/ALEJANDR0230/minizon  
**URL para clonar:** https://github.com/ALEJANDR0230/minizon.git  
**Rama principal:** `main`.

## 1. Objetivo y estado real

Trabajar desde computadoras distintas, conservar el historial y llevar los cambios a `main` mediante Pull Requests (PR), revisión y aprobación. Git guarda versiones en cada computadora; GitHub aloja el repositorio y controla permisos, revisiones y protecciones. Un commit es una versión registrada; una rama es una referencia a una línea de desarrollo; un PR solicita integrar una rama en otra.

El repositorio ya existía y contiene un proyecto. Se reutiliza por indicación de su propietario; no se presenta su creación como una acción realizada durante esta sesión.

| Requerimiento | Estado y evidencia |
|---|---|
| Creación de repositorio | Se explica el procedimiento; se trabaja sobre `minizon`, ya existente. |
| Colaboradores | Invitaciones enviadas a los dos correos proporcionados. Pendientes de aceptación por sus destinatarios en Settings > Collaborators. |
| Protección de `main` | Regla clásica creada en Settings > Branches, con PR obligatorio y una aprobación. |
| Flujo por computadora | Procedimiento completo en las secciones 4 y 5. |
| Explicación de comandos | Cada comando mostrado incluye finalidad y momento de uso. |
| Conflicto | Ejemplo reproducible en la sección 6, sin modificar el código de producción. |
| Solo lectura y escritura exclusiva en una rama | Se explica la configuración de organización en la sección 2. **No está aplicada en este repositorio personal.** |

**Límite importante:** la protección de ramas organiza la integración, pero no elimina los conflictos. Los conflictos aparecen al integrar cambios incompatibles; se resuelven en una rama de trabajo antes de hacer merge del PR.

## 2. Crear el repositorio y asignar permisos

### 2.1 Creación desde GitHub

1. Iniciar sesión en GitHub con la cuenta del responsable.
2. Abrir **+ > New repository**.
3. Elegir el propietario: cuenta personal para colaboración sencilla; organización para permisos `Read` y `Write` diferenciados y restricciones por usuario.
4. Indicar nombre y descripción. Elegir la visibilidad apropiada para el proyecto.
5. Para una práctica nueva, marcar **Add a README file**; crea el primer commit y la rama inicial. Elegir `.gitignore` según el lenguaje. Agregar una licencia solo si se ha decidido cuál corresponde.
6. Pulsar **Create repository**. Revisar el nombre de la rama predeterminada en **Settings > General > Default branch**. Esta guía usa `main`; si se utiliza `master`, sustituir ese nombre en comandos y reglas.

No hace falta ejecutar `git init` después de clonar: el clon ya incluye el repositorio Git.

### 2.2 Agregar a los compañeros en minizon

1. Abrir **Settings > Collaborators > Add people**.
2. Buscar el usuario de GitHub o correo de cada compañero.
3. Seleccionar el destinatario y pulsar **Add ...**.
4. Cada compañero acepta su propia invitación en GitHub o en el correo recibido.
5. Comprobar que aparece como colaborador activo; **Pending invitation** indica que todavía no aceptó. La invitación por correo no demuestra por sí sola cuál es su nombre de usuario.

Cada participante recibe su invitación de forma individual y usa su propia cuenta y credenciales.

**Resultado comprobado:** GitHub vinculó los correos a `mandobito3-netizen` y `alavezhardam-jpg`. Se enviaron ambas invitaciones y la página muestra **2 invitations**, cada una con **Pending Invite** y esperando respuesta. Hasta que cada persona acepte, no se considera colaborador activo.

En un repositorio personal como `ALEJANDR0230/minizon`, los colaboradores tienen lectura y escritura. No hay un selector equivalente a `Read` para cada colaborador. Como el repositorio es público, cualquier persona puede consultar o clonar su contenido sin recibir escritura. No invitar como colaborador a quien deba conservar únicamente lectura. [Permisos en repositorios personales](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository).

### 2.3 Configuración necesaria para permisos específicos

Para demostrar técnicamente las restricciones solicitadas, utilizar un repositorio de **organización**. Crear otro repositorio de práctica dentro de una organización evita cambiar la propiedad del proyecto existente. Transferir `minizon` requiere una decisión del propietario y revisión de sus integraciones.

| Persona de ejemplo | Rol del repositorio | Permiso previsto |
|---|---|---|
| Responsable | Admin | Administrar reglas; integrar PR cumpliendo las protecciones. |
| Observador | Read | Leer y comentar; sin push al repositorio. |
| Ana | Write | Escribir únicamente en `ana/trabajo`, al añadir las restricciones de ramas. |
| Bruno | Write | Escribir únicamente en `bruno/trabajo`, al añadir las restricciones de ramas. |

Los nombres Ana y Bruno son ejemplos, no identidades atribuidas a los correos. [Roles de organización](https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization).

Procedimiento para una organización:

1. Configurar permisos base en `Read` o `None`, sin permisos heredados de escritura para los observadores.
2. En el repositorio, **Settings > Collaborators and teams > Add people**, invitar al observador con `Read` y a los desarrolladores con `Write`. No darles `Admin`.
3. Proteger `main` con las opciones de la sección 3 y **Restrict who can push to matching branches**: permitir al responsable de integración. Aunque esté autorizado para integrar, debe cumplir el PR y su aprobación.
4. Crear una regla de nombre exacto `ana/trabajo`: habilitar **Restrict who can push to matching branches** y seleccionar únicamente a Ana; habilitar **Restrict pushes that create matching branches**. Repetir con `bruno/trabajo` y Bruno. No exigir PR en esas ramas de trabajo, pues necesitan recibir commits directos.
5. Crear reglas generales para `*` (nombres sin `/`) y `**/*` (nombres con `/`), restringiendo escritura y creación al responsable. Las reglas de nombre exacto tienen prioridad sobre los comodines. Solo una regla clásica se aplica a una rama: revisar la regla efectiva y probarla con cada cuenta. Autorizar cada nueva rama personal mediante una regla exacta adicional; un prefijo de nombre solo no protege nada.
6. Mantener deshabilitado `Allow deletions` para evitar que otro colaborador elimine ramas protegidas. Mantener deshabilitado `Allow force pushes`.
7. Comprobar que Ana puede subir a `ana/trabajo`, que no puede subir a `bruno/trabajo` ni crear `otra-rama`, y que nadie puede subir directamente a `main`. Bruno hace la comprobación inversa. El observador no debe poder subir a ninguna rama del repositorio. Para el resto de la guía, sustituir los nombres de ejemplo por las ramas exactas autorizadas si se aplica este esquema.

Estas restricciones están disponibles en repositorios públicos de organizaciones Free y en repositorios de organizaciones con los planes indicados por GitHub. Los administradores conservan facultades administrativas para editar reglas; no debe describirse la política como una barrera frente al propietario que decide cambiarla. [Reglas y prioridad](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule), [restricciones de ramas](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

Un convenio de nombres como `ana/tarea` **no impone permisos por sí solo**. `CODEOWNERS` asigna revisores de archivos, no exclusividad de escritura sobre ramas.

## 3. Protección aplicada a main

En **Settings > Branches > Add classic branch protection rule**, el patrón es exactamente `main`.

| Opción | Valor aplicado | Resultado |
|---|---|---|
| Require a pull request before merging | Activada | Los cambios se proponen desde otra rama. |
| Require approvals | Activada, 1 | Se necesita una revisión aprobatoria; el autor no aprueba su propio PR. |
| Dismiss stale pull request approvals when new commits are pushed | Activada | Cambios posteriores obligan a revisar otra vez. |
| Require approval of the most recent reviewable push | Activada | La última actualización debe aprobarla alguien distinto de quien la subió. |
| Require conversation resolution before merging | Activada | Resolver conversaciones pendientes antes de integrar. |
| Do not allow bypassing the above settings | Activada | Las protecciones también se aplican al administrador. |
| Allow force pushes | Desactivada | Evita reescribir el historial remoto de `main`. |
| Allow deletions | Desactivada | Evita eliminar `main`. |

No se activa **Lock branch**, porque impediría también integrar los PR. No se exigen comprobaciones de CI todavía: deben elegirse trabajos concretos y operativos antes de añadir ese requisito. Tampoco se impone historial lineal, por lo que se puede usar un merge commit.

La regla se guardó y GitHub mostró **Branch protection rule created**, aplicada a una rama. En una cuenta Free las protecciones se aplican a repositorios públicos como este. [Documentación oficial de ramas protegidas](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

**Evidencia real de esta sesión:** se creó la rama `alejandro/practica-git-github` y el [PR #3](https://github.com/ALEJANDR0230/minizon/pull/3) con la guía en `docs/PRACTICA_GIT_GITHUB.md`. El editor indicó que no se podía guardar directamente en `main`. El PR muestra **Review required**, **Merging is blocked** y el botón de merge deshabilitado, pendiente de una aprobación de alguien con escritura distinto del último autor del push. El PR permanece abierto; no se simuló una aprobación independiente.

Para comprobarlo con un cambio real, intentar un PR sin aprobación: GitHub debe bloquear el merge. Aprobar desde otra cuenta con escritura: el PR podrá integrarse si las demás condiciones se cumplen. No probar un push prohibido usando una credencial que no corresponde al usuario: eso verifica a la persona autenticada, no al nombre configurado en el commit.

## 4. Flujo completo desde cada computadora

### 4.1 Preparación individual: una vez por computadora

Instalar Git desde https://git-scm.com/downloads y utilizar Git Bash, PowerShell o la terminal del editor. Las líneas siguientes se ejecutan por separado. Los valores `Tu Nombre`, `tu-correo@example.com` y `miusuario` se sustituyen por los datos de cada participante.

```bash
git --version
git config --global user.name "Tu Nombre"
git config --global user.email "tu-correo@example.com"
git clone https://github.com/ALEJANDR0230/minizon.git
cd minizon
git remote -v
git status
```

| Comando | Qué significa y para qué sirve | Momento exacto |
|---|---|---|
| `git --version` | Muestra la versión instalada; verifica que la terminal reconoce Git. | Antes de iniciar la práctica. |
| `git config --global user.name "Tu Nombre"` | `config` cambia configuración; `--global` la aplica a los repositorios de este usuario del sistema; `user.name` es el autor mostrado en commits. | Antes del primer commit. No autentica en GitHub. |
| `git config --global user.email "tu-correo@example.com"` | Define el correo de autor. Usar un correo verificado en GitHub o el correo `noreply` indicado en la cuenta. | Antes del primer commit; tampoco concede permisos. |
| `git clone URL` | Copia archivos e historial, configura el remoto `origin` y deja activa la rama predeterminada. | Una vez por computadora, tras aceptar la invitación si se necesita escritura. |
| `cd minizon` | Comando de la terminal, no de Git. Cambia al directorio del clon. | Inmediatamente después de clonar; los siguientes comandos se ejecutan dentro. |
| `git remote -v` | `remote` administra remotos; `-v` muestra sus URL para descarga (`fetch`) y subida (`push`). | Después de clonar para comprobar que `origin` apunta al repositorio correcto. |
| `git status` | Muestra rama, archivos modificados, preparados y conflictos. | Antes de cambiar de rama, antes de commit y después de resolver un conflicto. |

Al hacer push por HTTPS, usar la autenticación de GitHub mediante el gestor de credenciales o el mecanismo de token configurado por cada usuario; la contraseña normal de la cuenta no autentica el push. No compartir credenciales ni incluir tokens en comandos/documentos.

### 4.2 Empezar una tarea desde main actualizado

```bash
git status
git switch main
git pull --ff-only origin main
git switch -c miusuario/documentacion
```

| Comando | Qué significa y para qué sirve | Momento exacto |
|---|---|---|
| `git status` | Permite confirmar que no hay cambios sin guardar. | Antes de salir de la rama actual. Si hay cambios, terminarlos y registrarlos en su rama antes de continuar. |
| `git switch main` | `switch` cambia la rama activa y los archivos de trabajo a `main`. | Antes de actualizar la base de una tarea nueva. |
| `git pull --ff-only origin main` | Descarga `main` de `origin` y actualiza la rama activa solo si puede avanzar sin divergencia. `--ff-only` evita un merge accidental en `main`. | Estando en `main`, antes de crear una rama. Si falla por divergencia, investigar los commits locales; no forzar ni borrar el trabajo. |
| `git switch -c miusuario/documentacion` | `-c` crea una rama y la activa desde el commit actual. | Inmediatamente después de actualizar `main`. Cada persona utiliza su propio prefijo y una rama por tarea. |

### 4.3 Editar, comprobar y registrar

Para la práctica, crear `practica/saludo.txt` con un editor; escribir `Hola desde miusuario` y guardar. Estos archivos de demostración no afectan el código de la aplicación.

```bash
git status
git diff
git add practica/saludo.txt
git diff --staged
git commit -m "docs: agrega saludo de la practica"
git push -u origin miusuario/documentacion
```

| Comando | Qué significa y para qué sirve | Momento exacto |
|---|---|---|
| `git diff` | Muestra diferencias de archivos rastreados que aún no están preparados. Los archivos nuevos sin rastrear deben inspeccionarse en el editor; no aparecen en este diff. | Después de editar, antes de preparar cambios. |
| `git add practica/saludo.txt` | Añade el contenido actual del archivo al área de preparación (`index`). La ruta explícita permite incluir solo lo previsto. | Tras comprobar el cambio. Si se vuelve a editar, repetir `add` para preparar la versión nueva. |
| `git diff --staged` | Muestra exactamente la diferencia preparada para el próximo commit. | Después de `add`, antes de `commit`. |
| `git commit -m "..."` | Crea una versión local de lo preparado; `-m` aporta el mensaje. No sube nada a GitHub. | Después de revisar el contenido preparado y verificar el comportamiento relevante. |
| `git push -u origin miusuario/documentacion` | Sube la rama a `origin`; `-u` establece su seguimiento remoto (`upstream`). | Primera publicación de esta rama, después del commit. No usar `main` como destino. |

### 4.4 Abrir, revisar y aprobar el Pull Request

1. El autor abre el repositorio en GitHub, pulsa **Compare & pull request** o **Pull requests > New pull request**.
2. Selecciona **base: main** y **compare: miusuario/documentacion**. Revisar el sentido de la comparación.
3. Escribe un título concreto y una descripción que explique el cambio, su finalidad y cómo lo comprobó. Pulsa **Create pull request**.
4. Solicita revisión a otro colaborador con escritura. No compartir la cuenta para simular una revisión independiente.
5. El revisor abre **Files changed**, lee las diferencias, deja comentarios en líneas específicas y comprueba que no se añadieron cambios ajenos a la tarea.
6. Para inspeccionar el código en su propia computadora, el revisor utiliza los comandos de la sección 5.
7. En **Review changes**, elige **Request changes** si hay problemas, **Comment** para comentarios sin aprobación o **Approve** si el cambio es correcto; pulsa **Submit review**. Una revisión `Comment` no cuenta como aprobación.
8. Si pidió cambios, el autor corrige en la misma rama, vuelve a preparar y registrar el archivo, y ejecuta `git push`. No hace falta crear otro PR: se actualiza el existente.
9. Como se invalidan aprobaciones antiguas, el revisor vuelve a revisar después del último push. Resolver los comentarios cuando la solución esté comprobada.

Para una corrección del archivo de práctica:

```bash
git add practica/saludo.txt
git diff --staged
git commit -m "docs: atiende comentarios de revision"
git push
```

`add`, `diff --staged` y `commit -m` cumplen las funciones ya descritas, ahora después de corregir la revisión. **`git push`**, sin argumentos, envía la rama actual a su upstream configurado mediante `-u`; se usa para las siguientes actualizaciones de esa misma rama. Confirmar antes con `git status` que se está en la rama correcta.

### 4.5 Hacer merge y sincronizar

1. Una persona con escritura abre el PR y verifica la aprobación vigente, las conversaciones resueltas y la ausencia de conflictos.
2. Selecciona **Merge pull request > Create a merge commit > Confirm merge**, cuando GitHub lo permita. El merge commit conserva los commits de la rama e identifica la integración.
3. No desactivar las protecciones para poder integrar. El autor puede hacer merge después de recibir la aprobación independiente si sus permisos lo permiten.
4. Cada participante actualiza su copia:

```bash
git status
git switch main
git pull --ff-only origin main
git log --oneline --graph -n 10
```

`status`, `switch main` y `pull --ff-only` se usan ahora después de que GitHub muestre **Merged**. **`git log --oneline --graph -n 10`** muestra los últimos diez commits: `--oneline` los resume en una línea y `--graph` dibuja sus relaciones. Se usa para comprobar que la integración está en el historial local.

Opcionalmente, después del merge commit y con `main` actualizado:

```bash
git branch -d miusuario/documentacion
```

**`git branch -d`** elimina la referencia de la rama local si Git considera sus commits integrados; no elimina la rama de GitHub. Se usa solo después de comprobar la integración. Si se eligió squash o rebase, Git puede negarse porque la historia cambió: no utilizar una eliminación forzada por rutina. La rama remota se puede conservar o eliminar desde el botón del PR si los permisos y las reglas lo permiten.

## 5. Revisión desde la computadora de otro participante

El revisor usa su propio clon, con trabajo guardado y `main` actualizado:

```bash
git fetch origin
git switch --detach origin/miusuario/documentacion
git diff origin/main...HEAD
```

| Comando | Qué significa y para qué sirve | Momento exacto |
|---|---|---|
| `git fetch origin` | Descarga commits y actualiza referencias `origin/...`; no modifica la rama activa ni los archivos de trabajo. | Al comenzar una revisión o antes de incorporar el `main` remoto. |
| `git switch --detach origin/miusuario/documentacion` | Abre el commit de la rama remota en estado `detached HEAD`, sin crear una rama de edición. | Después de `fetch`, para leer y ejecutar el código del PR. No registrar cambios en este estado como parte del flujo normal. |
| `git diff origin/main...HEAD` | Los tres puntos comparan el ancestro común con el commit actual (`HEAD`); muestran la aportación de la rama. | Durante la revisión local, antes de emitir `Approve` o `Request changes` en GitHub. |

Ejecutar las comprobaciones correspondientes al componente que cambió. Para el archivo de texto, basta abrirlo y comprobar el contenido; una modificación de aplicación requiere sus pruebas reales. Al terminar, ejecutar `git switch main` para volver a la rama local principal. Si el autor sube commits nuevos, repetir `fetch` y la revisión.

## 6. Conflicto práctico: dos personas cambian la misma línea

El ejercicio se realiza sobre `practica/saludo.txt`, no sobre un archivo productivo. Primero integrar mediante PR un archivo base con esta única línea:

```text
Hola equipo
```

Ana y Bruno actualizan `main` cuando contiene esa línea y crean sus ramas **antes de integrar cualquiera de los dos cambios**. Este momento es esencial: ambas ramas deben partir del mismo contenido.

Ana ejecuta `git switch -c ana/saludo`, reemplaza la línea por `Hola equipo, soy Ana`, y utiliza `git add practica/saludo.txt`, `git commit -m "docs: saludo de Ana"` y `git push -u origin ana/saludo`. Abre un PR; Bruno lo revisa y aprueba, y se integra a `main`.

Bruno, en su rama `bruno/saludo` creada desde la base original con `git switch -c bruno/saludo`, reemplaza la misma línea por `Hola equipo, soy Bruno`, registra con `git add practica/saludo.txt` y `git commit -m "docs: saludo de Bruno"`, y publica con `git push -u origin bruno/saludo`. Abre su PR. Como ambas modificaciones divergieron desde la misma línea, al incorporar el `main` actualizado aparece el conflicto.

Los comandos de creación, preparación, commit y primera publicación conservan el significado de la sección 4, pero se usan ahora en las ramas de cada persona y con los mensajes de este ejercicio.

### 6.1 Resolver en la rama de Bruno

```bash
git status
git switch bruno/saludo
git fetch origin
git merge origin/main
```

**`git merge origin/main`** incorpora el último `main` descargado en la rama **actual**, `bruno/saludo`. Se usa después de `fetch`, antes de integrar el PR de Bruno. No publica a `main` y no salta sus protecciones. Si hay conflictos, Git detiene la integración para que una persona decida el contenido.

Abrir `practica/saludo.txt`. Git mostrará un bloque equivalente a:

```text
<<<<<<< HEAD
Hola equipo, soy Bruno
=======
Hola equipo, soy Ana
>>>>>>> origin/main
```

- `<<<<<<< HEAD` inicia la versión de la rama actual, Bruno.
- `=======` separa las versiones.
- `>>>>>>> origin/main` termina la versión entrante, Ana.

Ambos acuerdan conservar los dos nombres. Sustituir **todo el bloque**, incluidos los marcadores, por:

```text
Hola equipo, somos Ana y Bruno
```

Guardar y completar:

```bash
git status
git diff
git add practica/saludo.txt
git diff --staged
git diff --staged --check
git commit -m "docs: resuelve conflicto de saludos"
git status
git push
```

| Paso | Finalidad y momento |
|---|---|
| `git status` y `git diff` | Después de editar la resolución, inspeccionan el estado y el cambio. `diff` durante un conflicto puede mostrar una comparación combinada. |
| `git add practica/saludo.txt` | Marca el archivo como resuelto y prepara el contenido acordado. Git no decide si esa solución es correcta: hay que revisarla. |
| `git diff --staged` | Inspecciona la resolución preparada antes de registrarla. |
| `git diff --staged --check` | Inspecciona las diferencias preparadas buscando errores de espacios y marcadores de conflicto; se usa después de `add` y antes del commit. También revisar el contenido acordado en el editor. |
| `git commit -m "docs: resuelve conflicto de saludos"` | Completa el merge local en la rama de Bruno con la resolución. |
| `git status` | Confirma que terminó el merge y no quedan archivos sin resolver. |
| `git push` | Publica la resolución en `bruno/saludo`, actualizando su PR. Nunca se sube directamente a `main`. |

Ana vuelve a revisar y aprobar la última actualización. Después se hace el merge del PR de Bruno en GitHub y ambos actualizan `main` con los comandos de la sección 4.5.

Si se necesita cancelar el intento de integración antes del commit:

```bash
git merge --abort
```

**`git merge --abort`** intenta restaurar el estado anterior al merge; se usa únicamente mientras hay un merge en curso y se ha decidido posponer la resolución. Es conveniente comenzar con un árbol de trabajo limpio, porque cambios anteriores sin registrar pueden dificultar la restauración. [Documentación de merge](https://git-scm.com/docs/git-merge).

## 7. Evidencias para entregar la práctica

1. Página del repositorio con propietario, visibilidad y `main`.
2. Colaboradores: invitaciones enviadas y, cuando respondan, aceptación.
3. Regla de `main` con PR obligatorio, una aprobación y aplicación al administrador.
4. PR con **base main**, rama del autor, cambios, revisión independiente y estado **Merged**.
5. Terminal de cada participante con creación de rama, commit y push.
6. Conflicto en el archivo de práctica, contenido acordado, commit de resolución y PR aprobado de nuevo.
7. Para cumplir permisos por persona: repositorio de organización, roles y comprobaciones de push permitido/prohibido en ramas personales.

Una regla configurada no es evidencia de que todos los participantes hayan ejecutado el flujo. No marcar una invitación como aceptada sin comprobarlo ni presentar la simulación local como revisión de personas reales.

## 8. Verificación local del ejemplo

El 8 de octubre de 2026 se ejecutó una simulación en un repositorio aislado: dos ramas cambiaron la misma línea; Git produjo un conflicto real; se acordó el texto combinado, se registró la resolución y se comprobó el árbol limpio. El resultado fue `Hola equipo, somos Ana y Bruno`. No se hicieron cambios al código productivo de `minizon` para esta prueba. El registro local está en `Verificacion_conflicto.txt`.

La simulación usa además estas variantes de comandos, explicadas para que su registro sea interpretable:

| Comando o variante | Qué significa, para qué sirve y cuándo se usó |
|---|---|
| `git init -b main` | Crea un repositorio Git vacío; `-b main` fija la rama inicial. Solo al crear el repositorio local aislado, antes del primer commit; no se usa después de `clone`. |
| `git config user.name "Participante de demostracion"` | Sin `--global`, define el autor solo en ese repositorio de prueba, antes de sus commits. |
| `git config user.email "demo@example.invalid"` | Define un correo ficticio solo en el demo, antes de sus commits. No autentica ninguna cuenta. |
| `git branch bruno/saludo` | Crea una referencia a una rama desde el commit actual, sin cambiar a ella. Se usó desde la base común, antes de que Ana modificara el saludo. |
| `git merge --no-ff ana/saludo -m "Integracion simulada de Ana"` | Integra la rama de Ana en el `main` local del demo; `--no-ff` obliga a crear un merge commit y `-m` proporciona el mensaje. Simula la integración de un PR, sin revisión ni GitHub reales. Se repitió con Bruno después de resolver el conflicto. |
| `git merge main` | Integra el `main` local del demo en la rama activa de Bruno; produjo el conflicto después de ambos commits incompatibles. Equivale a usar `origin/main` en el ejercicio conectado, una vez descargado. |
| `git status --porcelain` | Variante de `status` con salida estable para verificación automática. Una salida vacía comprobó el árbol de trabajo limpio después de registrar la resolución. |

Los demás comandos del registro tienen las funciones y momentos ya descritos. La simulación demuestra la resolución de Git; la revisión independiente y el merge protegido deben completarlos los compañeros con sus propias cuentas.
