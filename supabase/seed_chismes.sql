-- Script para insertar chismes de prueba
-- IMPORTANTE: Asegúrate de tener al menos un usuario creado antes de ejecutar esto

-- Opción 1: Si ya tienes usuarios, usa el primer usuario disponible
-- Esto insertará chismes usando el ID del primer usuario en la tabla profiles

INSERT INTO chismes (user_id, titulo, contenido, aprobado, created_at)
SELECT 
  (SELECT id FROM profiles LIMIT 1),
  'El chisme más jugoso del año',
  '¡No van a creer lo que pasó ayer! Resulta que en la oficina, el jefe y la secretaria fueron vistos saliendo juntos del restaurante más caro de la ciudad. Y lo mejor de todo... ¡llevaban anillos de compromiso! Pero esperen, hay más: resulta que ambos están casados... pero no entre ellos. ¿Qué está pasando aquí? 🤔',
  true,
  NOW() - INTERVAL '2 days'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

INSERT INTO chismes (user_id, titulo, contenido, aprobado, created_at)
SELECT 
  (SELECT id FROM profiles LIMIT 1),
  'El vecino tiene un secreto muy oscuro',
  'Mi vecino del 3B siempre ha sido muy misterioso. Nunca sale de día, solo de noche. Pero ayer descubrí algo que me dejó helado: tiene una colección de plantas carnívoras gigantes en su balcón. Y no son plantas normales... ¡son del tamaño de un perro! ¿Qué está alimentando? No quiero saberlo, pero definitivamente es el chisme más raro que he visto.',
  true,
  NOW() - INTERVAL '1 day'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

INSERT INTO chismes (user_id, titulo, contenido, aprobado, created_at)
SELECT 
  (SELECT id FROM profiles LIMIT 1),
  'La cafetería del barrio esconde algo',
  'Siempre me pregunté por qué la cafetería "El Rincón" nunca tiene clientes pero sigue abierta desde hace 10 años. Ayer lo descubrí: el dueño es en realidad un millonario que la mantiene abierta solo porque su primer amor trabajó ahí hace 30 años. ¡Romántico pero un poco obsesivo, no creen?',
  true,
  NOW() - INTERVAL '5 hours'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

INSERT INTO chismes (user_id, titulo, contenido, aprobado, created_at)
SELECT 
  (SELECT id FROM profiles LIMIT 1),
  'El perro del parque habla (o eso dice mi sobrino)',
  'Mi sobrino de 5 años insiste en que el perro del parque le habla. Al principio pensamos que era su imaginación, pero ayer grabé un video y... bueno, no voy a decir que el perro habla, pero definitivamente hace sonidos muy raros cuando nadie más está mirando. ¿Alguien más ha notado esto?',
  false,
  NOW() - INTERVAL '3 hours'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

INSERT INTO chismes (user_id, titulo, contenido, aprobado, created_at)
SELECT 
  (SELECT id FROM profiles LIMIT 1),
  'El ascensor del edificio tiene vida propia',
  'El ascensor de mi edificio es... especial. No solo se detiene en pisos aleatorios, sino que a veces suena música de los 80s cuando nadie presiona ningún botón. El conserje dice que es un "problema técnico", pero yo creo que el ascensor tiene un alma atrapada. ¿Alguien más lo ha notado?',
  true,
  NOW() - INTERVAL '1 hour'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

INSERT INTO chismes (user_id, titulo, contenido, aprobado, created_at)
SELECT 
  (SELECT id FROM profiles LIMIT 1),
  'Mi compañero de trabajo es un espía (o al menos eso parece)',
  'Mi compañero de trabajo siempre habla por teléfono en código. Dice cosas como "el águila ha aterrizado" y "necesito más café, el tipo fuerte". Al principio pensé que era broma, pero lleva 3 años así. ¿Es un espía? ¿O solo tiene una forma muy extraña de pedir pizza? El misterio continúa...',
  false,
  NOW() - INTERVAL '30 minutes'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

INSERT INTO chismes (user_id, titulo, contenido, aprobado, created_at)
SELECT 
  (SELECT id FROM profiles LIMIT 1),
  'El gato del barrio es el verdadero jefe',
  'Hay un gato naranja que siempre está en el mismo banco del parque. Todos los días, a las 3 PM exactas. Los pájaros le traen comida. Los perros le hacen reverencia. Incluso vi a un policía acariciarlo. Este gato definitivamente es el jefe del barrio y nadie puede convencerme de lo contrario.',
  true,
  NOW() - INTERVAL '15 minutes'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

INSERT INTO chismes (user_id, titulo, contenido, aprobado, created_at)
SELECT 
  (SELECT id FROM profiles LIMIT 1),
  'La librería tiene libros que se leen solos',
  'En la librería de la esquina hay una sección especial. Los libros ahí se abren solos por las noches. El dueño dice que es "corriente de aire", pero yo vi las cámaras de seguridad (trabajo en seguridad) y no hay viento. Los libros literalmente se abren y las páginas se voltean solas. ¿Alguien más lo ha visto?',
  false,
  NOW() - INTERVAL '10 minutes'
WHERE EXISTS (SELECT 1 FROM profiles LIMIT 1);

-- Si quieres aprobar todos los chismes pendientes de una vez, ejecuta esto:
-- UPDATE chismes SET aprobado = true WHERE aprobado = false;

