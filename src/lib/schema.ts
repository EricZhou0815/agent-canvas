import { z } from 'zod'

const slideTypeEnum = z.enum(['dashboard', 'timeline', 'kanban', 'form'])

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  status: z.enum(['TODO', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  due: z.string().optional(),
})

const collectionSchema = z.object({
  name: z.string().min(1),
  amount: z.number().nonnegative().optional(),
})

const timelineItemSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  done: z.boolean(),
})

const kanbanItemSchema = z.object({
  title: z.string().min(1),
})

const kanbanColumnSchema = z.object({
  title: z.string().min(1),
  items: z.array(kanbanItemSchema).optional(),
})

const formFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'textarea', 'number']).optional(),
  placeholder: z.string().optional(),
})

const slideSchema = z.object({
  type: slideTypeEnum,
  title: z.string().min(1),
  data: z.object({
    battery: z.number().int().min(0).max(100).optional(),
    tasks: z.array(taskSchema).optional(),
    collections: z.array(collectionSchema).optional(),
    items: z.array(timelineItemSchema).optional(),
    columns: z.array(kanbanColumnSchema).optional(),
    fields: z.array(formFieldSchema).optional(),
  }),
})

export const canvasPushSchema = z.object({
  slides: z.array(slideSchema).min(1),
  currentIndex: z.number().int().nonnegative().optional(),
})
