import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.cycleTemplate.findFirst({
    where: { name: 'Plan Junio 2026 — Sin taller' },
  })
  if (existing) {
    console.log('Plan de Junio 2026 ya existe, omitiendo seed.')
    return
  }

  const latest = await prisma.cycleTemplate.findFirst({ orderBy: { version: 'desc' } })
  const nextVersion = (latest?.version ?? 0) + 1

  const template = await prisma.cycleTemplate.create({
    data: { version: nextVersion, name: 'Plan Junio 2026 — Sin taller' },
  })

  const tasks = [
    // Semana 1 · 1–7 jun — PREP
    { title: 'Setup sistema de tags en Brevo', description: 'Configurar tags para segmentación', phase: 'PREP', owners: ['cristhian'], weight: 'LOW', order: 1 },
    { title: 'Definir link de Zoom recurrente para el Café Jurídico', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'LOW', order: 2 },
    { title: 'Redactar email a los 17 miembros: Café del 20, formato Q&A, grabación 7 días en Circle', description: 'Enviar por Brevo', phase: 'PREP', owners: ['cristhian'], weight: 'MEDIUM', order: 3 },
    { title: 'Enviar mensaje WhatsApp personalizado a miembros fríos en Circle', description: 'Copy de Cristhian', phase: 'PREP', owners: ['sahian'], weight: 'MEDIUM', order: 4 },
    { title: 'Publicar post en Circle: fecha Café, formato, cómo enviar pregunta previa', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'MEDIUM', order: 5 },
    { title: 'Actualizar landing /membresia/ con Café Jurídico como gancho', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'MEDIUM', order: 6 },
    { title: 'Construir página biblioteca de lives (no-indexada, destino del lead magnet)', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'HIGH', order: 7 },
    { title: 'Construir landing pública del lead magnet con Fluent Forms', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'HIGH', order: 8 },
    { title: 'Configurar email automático de bienvenida en Brevo con link a biblioteca', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'HIGH', order: 9 },
    { title: 'Crear tag lead-magnet-lives en Brevo y enlazarlo al flujo', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'LOW', order: 10 },
    { title: 'Diseñar artwork para anuncio del Café Jurídico (redes y Circle)', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'MEDIUM', order: 11 },

    // Semana 2 · 8–14 jun — WARM
    { title: 'Preparar material del live gratuito del 14', description: 'Meta: lunes 8', phase: 'WARM', owners: ['andres'], weight: 'HIGH', order: 1 },
    { title: 'Redactar y programar email de convocatoria al live', description: 'Enviar por Brevo', phase: 'WARM', owners: ['cristhian'], weight: 'MEDIUM', order: 2 },
    { title: 'Enviar convocatoria al live por SendFox', description: '', phase: 'WARM', owners: ['sahian'], weight: 'MEDIUM', order: 3 },
    { title: 'Brief a Sandra: campaña Meta orientada a registros al live', description: 'Fuera del ecosistema actual', phase: 'WARM', owners: ['cristhian'], weight: 'MEDIUM', order: 4 },
    { title: 'Diseñar artwork del live para pauta y orgánico', description: '', phase: 'WARM', owners: ['cristhian'], weight: 'LOW', order: 5 },
    { title: 'Grabar y publicar 2 posts orgánicos anunciando el live', description: 'Andrés graba y publica / Sahian publica si Andrés lo indica', phase: 'WARM', owners: ['andres', 'sahian'], weight: 'MEDIUM', order: 6 },
    { title: 'Grabar y publicar story/reel recordatorio 24h antes del live', description: '', phase: 'WARM', owners: ['andres'], weight: 'LOW', order: 7 },
    { title: 'Configurar página de registro del live (Fluent Forms)', description: '', phase: 'WARM', owners: ['cristhian'], weight: 'MEDIUM', order: 8 },
    { title: 'Programar email recordatorio 24h antes a registrados', description: 'Enviar por Brevo', phase: 'WARM', owners: ['cristhian'], weight: 'MEDIUM', order: 9 },
    { title: 'Dom 14: Live gratuito — ¿Se puede tratar la caducidad en el juicio de excepciones a la coactiva?', description: '', phase: 'WARM', owners: ['andres'], weight: 'HIGH', order: 10 },
    { title: 'Post-live: email a lista con resumen + CTA lead magnet', description: 'Enviar por Brevo', phase: 'WARM', owners: ['cristhian'], weight: 'MEDIUM', order: 11 },
    { title: 'Post-live: publicar en estados de WhatsApp', description: '', phase: 'WARM', owners: ['sahian'], weight: 'LOW', order: 12 },

    // Semana 3 · 15–20 jun — CLOSE
    { title: 'Actualizar copy del pitch de L+ en Kommo', description: '', phase: 'CLOSE', owners: ['cristhian'], weight: 'LOW', order: 1 },
    { title: 'Brief a Sandra: creativos para ads de L+ con gancho del Café Jurídico', description: '', phase: 'CLOSE', owners: ['cristhian'], weight: 'LOW', order: 2 },
    { title: 'Redactar y enviar email a lista general anunciando el Café Jurídico', description: 'Enviar por Brevo', phase: 'CLOSE', owners: ['cristhian'], weight: 'MEDIUM', order: 3 },
    { title: 'Enviar anuncio del Café a lista SendFox', description: '', phase: 'CLOSE', owners: ['sahian'], weight: 'MEDIUM', order: 4 },
    { title: 'Enviar recordatorio al Café a los 17 miembros 48h antes', description: 'Brevo + WhatsApp', phase: 'CLOSE', owners: ['cristhian', 'sahian'], weight: 'MEDIUM', order: 5 },
    { title: 'Cerrar recolección de preguntas previas al Café', description: 'Cierre 48h antes vía WhatsApp', phase: 'CLOSE', owners: ['sahian'], weight: 'LOW', order: 6 },
    { title: 'Preparar preguntas y material para el Café Jurídico', description: '', phase: 'CLOSE', owners: ['andres'], weight: 'HIGH', order: 7 },
    { title: 'Vie 20: Primer Café Jurídico · 20h00 · Zoom · Q&A 45 min', description: 'Andrés presenta / Sahian asiste y graba', phase: 'CLOSE', owners: ['andres', 'sahian'], weight: 'HIGH', order: 8 },
    { title: 'Subir grabación a Circle, espacio exclusivo miembros, ventana 7 días', description: '', phase: 'CLOSE', owners: ['sahian'], weight: 'MEDIUM', order: 9 },

    // Semana 4 · 22–30 jun — RETARGET
    { title: 'Reporte de asistencia y engagement del Café Jurídico', description: '', phase: 'RETARGET', owners: ['cristhian'], weight: 'LOW', order: 1 },
    { title: 'Redactar 1 email narrativo de contenido para envío en junio', description: 'Andrés redacta / Cristhian ajusta y envía por Brevo', phase: 'RETARGET', owners: ['andres', 'cristhian'], weight: 'MEDIUM', order: 2 },
    { title: '1 email de activación para leads nuevos captados en el mes', description: 'Enviar por Brevo', phase: 'RETARGET', owners: ['cristhian'], weight: 'MEDIUM', order: 3 },
    { title: 'Métricas del mes: leads, registros al live, asistencia Café, estado L+', description: '', phase: 'RETARGET', owners: ['cristhian'], weight: 'LOW', order: 4 },
    { title: 'Publicar en estados de WhatsApp: teaser taller julio', description: '', phase: 'RETARGET', owners: ['sahian'], weight: 'LOW', order: 5 },
    { title: 'Plan Taller Julio: tema, fechas, cohortes, estructura de oferta y campaña', description: 'Cristhian gestiona con Andrés', phase: 'RETARGET', owners: ['cristhian', 'andres'], weight: 'HIGH', order: 6 },
  ]

  for (const task of tasks) {
    await prisma.task.create({
      data: { ...task, templateId: template.id } as Parameters<typeof prisma.task.create>[0]['data'],
    })
  }

  console.log(`✅ Plan Junio 2026 creado — v${nextVersion}, ${tasks.length} tareas en 4 semanas.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
