import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const template = await prisma.cycleTemplate.findFirst({
    where: { name: 'Plan Junio 2026 — Sin taller' },
    orderBy: { version: 'desc' },
  })

  if (!template) {
    console.error('❌ No se encontró el template "Plan Junio 2026 — Sin taller". Corre seed-june-2026.ts primero.')
    return
  }

  // Archive all existing tasks from the old version
  await prisma.task.updateMany({
    where: { templateId: template.id },
    data: { archived: true },
  })

  // Bump version
  const updated = await prisma.cycleTemplate.update({
    where: { id: template.id },
    data: { version: template.version + 1 },
  })

  const tasks = [
    // ─── Semana 1 · 1–7 jun — Live gratuito ────────────────────────
    { title: 'Configurar página de registro del live (Fluent Forms)', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'HIGH', order: 1 },
    { title: 'Diseñar artwork del live para pauta y orgánico', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'HIGH', order: 2 },
    { title: 'Redactar copy de anuncio del live', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'HIGH', order: 3 },
    { title: 'Publicar campaña Meta orientada a registros al live', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'HIGH', order: 4 },
    { title: 'Replicar campaña del live en TikTok', description: 'Con assets de Cristhian', phase: 'PREP', owners: ['sandra'], weight: 'HIGH', order: 5 },
    { title: 'Redactar y enviar email de convocatoria al live a toda la lista Brevo', description: '', phase: 'PREP', owners: ['cristhian'], weight: 'HIGH', order: 6 },
    { title: 'Enviar convocatoria al live por SendFox', description: '', phase: 'PREP', owners: ['sahian'], weight: 'MEDIUM', order: 7 },
    { title: 'Publicar en estados de WhatsApp anunciando el live', description: '', phase: 'PREP', owners: ['sahian'], weight: 'MEDIUM', order: 8 },
    { title: 'Grabar y publicar post orgánico anunciando el live', description: '', phase: 'PREP', owners: ['andres'], weight: 'MEDIUM', order: 9 },
    { title: 'Grabar y publicar story/reel recordatorio 48h antes del live', description: 'Vie 5 jun', phase: 'PREP', owners: ['andres'], weight: 'MEDIUM', order: 10 },
    { title: 'Programar email recordatorio 24h antes a registrados', description: 'Brevo · sáb 6 jun', phase: 'PREP', owners: ['cristhian'], weight: 'HIGH', order: 11 },
    { title: 'Preparar material del live', description: 'Meta: mié 4 jun', phase: 'PREP', owners: ['andres'], weight: 'HIGH', order: 12 },
    { title: 'Dom 7: Live gratuito — ¿Se puede tratar la caducidad en el juicio de excepciones a la coactiva?', description: '', phase: 'PREP', owners: ['andres'], weight: 'HIGH', order: 13 },
    { title: 'Post-live: email a lista con resumen + CTA lead magnet', description: 'Brevo · dom 7 noche', phase: 'PREP', owners: ['cristhian'], weight: 'HIGH', order: 14 },
    { title: 'Post-live: publicar en estados de WhatsApp', description: '', phase: 'PREP', owners: ['sahian'], weight: 'LOW', order: 15 },

    // ─── Semana 2 · 8–14 jun — Primer Café Jurídico + lead magnet ──
    { title: 'Publicar post en Circle: fecha Café, dinámica de los 2 bloques, cómo enviar pregunta previa', description: '', phase: 'WARM', owners: ['cristhian'], weight: 'HIGH', order: 1 },
    { title: 'Redactar y enviar email a los 17 miembros: Café del 9, dinámica, grabación 7 días', description: 'Brevo', phase: 'WARM', owners: ['cristhian'], weight: 'HIGH', order: 2 },
    { title: 'Mensaje WhatsApp a miembros sobre el Café Jurídico', description: 'Copy de Cristhian', phase: 'WARM', owners: ['sahian'], weight: 'MEDIUM', order: 3 },
    { title: 'Cerrar recolección de preguntas de casos', description: 'WhatsApp · cierre lun 8 AM', phase: 'WARM', owners: ['sahian'], weight: 'MEDIUM', order: 4 },
    { title: 'Preparar reflexión del bloque 1 del Café', description: '', phase: 'WARM', owners: ['andres'], weight: 'HIGH', order: 5 },
    { title: 'Confirmar link de Zoom recurrente', description: '', phase: 'WARM', owners: ['cristhian'], weight: 'LOW', order: 6 },
    { title: 'Mar 9: Primer Café Jurídico · 20h00 · Zoom · Bloque 1: reflexión · Bloque 2: preguntas', description: 'Andrés presenta / Sahian asiste y graba', phase: 'WARM', owners: ['andres', 'sahian'], weight: 'HIGH', order: 7 },
    { title: 'Subir grabación a Circle, espacio exclusivo miembros, ventana 7 días', description: '', phase: 'WARM', owners: ['sahian'], weight: 'HIGH', order: 8 },
    { title: 'Setup sistema de tags en Brevo', description: 'Configurar tags para segmentación', phase: 'WARM', owners: ['cristhian'], weight: 'MEDIUM', order: 9 },
    { title: 'Construir página biblioteca de lives (no-indexada)', description: 'Destino del lead magnet', phase: 'WARM', owners: ['cristhian'], weight: 'HIGH', order: 10 },
    { title: 'Construir landing pública del lead magnet con Fluent Forms', description: '', phase: 'WARM', owners: ['cristhian'], weight: 'HIGH', order: 11 },
    { title: 'Configurar email automático de bienvenida en Brevo con link a biblioteca', description: '', phase: 'WARM', owners: ['cristhian'], weight: 'HIGH', order: 12 },
    { title: 'Crear tag lead-magnet-lives en Brevo y enlazarlo al flujo', description: '', phase: 'WARM', owners: ['cristhian'], weight: 'MEDIUM', order: 13 },

    // ─── Semana 3 · 15–21 jun — Infraestructura L+ y relanzamiento ──
    { title: 'Diseñar artwork Café Jurídico para redes y Circle', description: '', phase: 'CLOSE', owners: ['cristhian'], weight: 'MEDIUM', order: 1 },
    { title: 'Actualizar landing /membresia/ con Café Jurídico como gancho', description: '', phase: 'CLOSE', owners: ['cristhian'], weight: 'HIGH', order: 2 },
    { title: 'Actualizar copy del pitch de L+ en Kommo', description: '', phase: 'CLOSE', owners: ['cristhian'], weight: 'HIGH', order: 3 },
    { title: 'Redactar copy y diseñar creativos para ads de L+', description: '', phase: 'CLOSE', owners: ['cristhian'], weight: 'HIGH', order: 4 },
    { title: 'Publicar campaña Meta L+', description: '', phase: 'CLOSE', owners: ['cristhian'], weight: 'HIGH', order: 5 },
    { title: 'Replicar campaña L+ en TikTok', description: 'Con assets de Cristhian', phase: 'CLOSE', owners: ['sandra'], weight: 'HIGH', order: 6 },
    { title: 'Redactar y enviar email a lista general presentando nueva L+', description: 'Brevo', phase: 'CLOSE', owners: ['cristhian'], weight: 'HIGH', order: 7 },
    { title: 'Enviar anuncio L+ a lista SendFox', description: '', phase: 'CLOSE', owners: ['sahian'], weight: 'MEDIUM', order: 8 },

    // ─── Semana 4 · 22–28 jun — Canal editorial, cierre, taller julio ─
    { title: 'Redactar email narrativo de contenido del mes', description: 'Andrés redacta · Cristhian ajusta y envía por Brevo', phase: 'RETARGET', owners: ['andres', 'cristhian'], weight: 'MEDIUM', order: 1 },
    { title: '1 email de activación para leads nuevos captados en el mes', description: 'Brevo', phase: 'RETARGET', owners: ['cristhian'], weight: 'HIGH', order: 2 },
    { title: 'Reporte del mes: leads capturados, registros live, asistencia Café, estado L+', description: '', phase: 'RETARGET', owners: ['cristhian'], weight: 'HIGH', order: 3 },
    { title: 'Publicar teaser taller julio en estados de WhatsApp', description: '', phase: 'RETARGET', owners: ['sahian'], weight: 'MEDIUM', order: 4 },
    { title: 'Plan Taller Julio: tema, fechas, cohortes, oferta y campaña', description: 'Cristhian gestiona con Andrés', phase: 'RETARGET', owners: ['cristhian', 'andres'], weight: 'HIGH', order: 5 },
  ]

  for (const task of tasks) {
    await prisma.task.create({
      data: { ...task, templateId: template.id } as Parameters<typeof prisma.task.create>[0]['data'],
    })
  }

  console.log(`✅ Plan Junio 2026 actualizado — v${updated.version}, ${tasks.length} tareas en 4 semanas.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
