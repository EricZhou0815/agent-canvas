import { z } from 'zod'

const slideTypeEnum = z.enum(['dashboard', 'timeline', 'kanban', 'form', 'page', 'table', 'chart'])

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

const tableColumnSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
})

const tableSchema = z.object({
  columns: z.array(tableColumnSchema).min(1),
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).optional(),
})

const chartSchema = z.object({
  type: z.enum(['line', 'bar', 'pie']),
  data: z.array(z.object({
    name: z.string().min(1),
    value: z.number(),
  })).min(1),
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
    content: z.string().optional(),
    table: tableSchema.optional(),
    chart: chartSchema.optional(),
  }),
})

export const canvasPushSchema = z.object({
  slides: z.array(slideSchema).min(1),
  currentIndex: z.number().int().nonnegative().optional(),
})
