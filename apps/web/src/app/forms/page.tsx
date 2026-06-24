'use client'

import { useState, useEffect, useCallback } from 'react'
import { api, fetchApi } from '@/lib/api'
import Header from '@/components/layout/header'
import { useAccount } from '@/contexts/account-context'

interface Form {
  id: string
  name: string
  description: string
  fields: FormField[]
  onSubmitTagId?: string
  onSubmitScenarioId?: string
  saveToMetadata: boolean
  onSubmitReminderId?: string
  onSubmitReminderDateField?: string
}

interface CreateForm {
  name: string
  description: string
  fields: FormField[]
  onSubmitTagId?: string
  onSubmitScenarioId?: string
  saveToMetadata: boolean
  onSubmitReminderId?: string
  onSubmitReminderDateField?: string
}

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date'
  required?: boolean
  options?: string
  placeholder?: string
}

interface Reminder {
  id: string
  name: string
}

export default function FormsPage() {
  const { selectedAccountId } = useAccount()
  const [forms, setForms] = useState<Form[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>({
    name: '',
    description: '',
    fields: [],
    onSubmitTagId: '',
    onSubmitScenarioId: '',
    saveToMetadata: false,
    onSubmitReminderId: '',
    onSubmitReminderDateField: '',
  })
  const [fieldsJson, setFieldsJson] = useState('[]')
  const [fieldJsonMap, setFieldJsonMap] = useState<Record<string, string>>({})
  const [reminders, setReminders] = useState<Reminder[]>([])

  const loadForms = useCallback(async () => {
    try {
      const res = await fetchApi<{ success: boolean; data: Form[] }>('/api/forms')
      if (res.success) {
        setForms(res.data)
        setFieldJsonMap(
          Object.fromEntries(res.data.map(form => [form.id, JSON.stringify(form.fields, null, 2)]))
        )
      }
    } catch { /* silent */ }
  }, [])

  const handleCreateForm = async (form: CreateForm) => {
    try {
      const fields: FormField[] = JSON.parse(fieldsJson)
      const res = await fetchApi<{ success: boolean; data: Form }>('/api/forms', {
        method: 'POST',
        body: JSON.stringify({ ...form, fields })
      })
      if (res.success) {
        setForms((prev) => [...prev, res.data])

        setFieldJsonMap((prev) => ({
          ...prev,
          [res.data.id]: JSON.stringify(res.data.fields, null, 2)
        }))
      
        setShowCreateForm(false)
      
        setCreateForm({
          name: '',
          description: '',
          fields: [],
          onSubmitTagId: '',
          onSubmitScenarioId: '',
          saveToMetadata: false,
          onSubmitReminderId: '',
          onSubmitReminderDateField: '',
        })
      
        setFieldsJson('[]')
      }
    } catch { /* silent */ }
  }

  const handleUpdateForm = async (form: Form) => {
    try {
      const fields: FormField[] = JSON.parse(fieldJsonMap[form.id])
      const res = await fetchApi<{ success: boolean; data: Form }>(`/api/forms/${form.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...form, fields })
      })
      if (res.success) {
        setForms((prev) => prev.map(f => f.id === form.id ? res.data : f))
        setFieldJsonMap((prev) => ({
          ...prev,
          [form.id]: JSON.stringify(res.data.fields, null, 2)
        }))
      }
    } catch { /* silent */ }
  }

  const loadReminders = useCallback(async () => {
    try {
        const res = await api.reminders.list({ accountId: selectedAccountId || undefined })
        if (res.success) {
          setReminders(res.data)
        }
      } catch {}
    }, [selectedAccountId])

  const getDateFields = (json: string) => {
    try {
      const fields: FormField[] = JSON.parse(json)
      return fields.filter((field) => field.type === 'date')
    } catch {
      return []
    }
  }

  const createDateFields = getDateFields(fieldsJson)

  useEffect(() => {
    loadForms()
    loadReminders()
  }, [loadForms, loadReminders])

  return (
    <div>
      <div className="flex items-center justify-between">
        <Header title="フォーム一覧" />
        <button type="button" className="px-4 py-2 bg-green-500 text-white rounded" onClick={() => {setShowCreateForm(true)}}>
          新規作成
        </button>
      </div>
      <div className="container mx-auto p-6">
        <div className="space-y-2">
          {forms.map((form) => {
            const editDateFields = getDateFields(fieldJsonMap[form.id] ?? '[]')

            return (
              <div key={form.id} className="p-4 border rounded space-y-2">
                <div>
                  <label>フォーム名</label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForms((prev) =>
                        prev.map((f) =>
                          f.id === form.id
                            ? { ...f, name: e.target.value }
                            : f
                        )
                      )
                    }
                    data-testid={`edit-form-name-${form.id}`}
                  />
                </div>
  
                <div>
                  <label>フォーム説明</label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForms((prev) =>
                        prev.map((f) =>
                          f.id === form.id
                            ? { ...f, description: e.target.value }
                            : f
                        )
                      )
                    }
                    data-testid={`edit-form-description-${form.id}`}
                  />
                </div>
  
                <div>
                  <label>フィールド定義（JSON形式）</label>
                  <textarea
                    value={fieldJsonMap[form.id] ?? ''}
                    onChange={(e) => {
                      setFieldJsonMap((prev) => ({
                        ...prev,
                        [form.id]: e.target.value
                      }))
                    }}
                    data-testid={`edit-form-fields-${form.id}`}
                  />
                </div>
  
                <div>
                  <label>送信時タグ付与（タグID）</label>
                  <input
                    value={form.onSubmitTagId}
                    onChange={(e) =>
                      setForms((prev) =>
                        prev.map((f) =>
                          f.id === form.id
                            ? { ...f, onSubmitTagId: e.target.value }
                            : f
                        )
                      )
                    }
                    data-testid={`edit-form-tag-id-${form.id}`}
                  />
                </div>
  
                <div>
                  <label>送信時シナリオ登録（シナリオID）</label>
                  <input
                    value={form.onSubmitScenarioId}
                    onChange={(e) =>
                      setForms((prev) =>
                      prev.map((f) =>
                        f.id === form.id
                          ? { ...f, onSubmitScenarioId: e.target.value }
                          : f
                      )
                    )
                  }
                  data-testid={`edit-form-scenario-id-${form.id}`}
                />
              </div>
  
              <div className="space-y-2">
                <h3>送信時にリマインダへ登録</h3>
                <div>
                  <label>リマインダ選択</label>
                  <select value={form.onSubmitReminderId} onChange={(e) => setForms((prev) => prev.map((f) => f.id === form.id ? { ...f, onSubmitReminderId: e.target.value } : f))} className="w-full p-2 border rounded" data-testid={`edit-form-reminder-id-${form.id}`}>
                    {reminders.map((reminder) => (
                      <option key={reminder.id} value={reminder.id}>
                        {reminder.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>基準日として使うフィールドの選択</label>
                  <select value={form.onSubmitReminderDateField} onChange={(e) => setForms((prev) => prev.map((f) => f.id === form.id ? { ...f, onSubmitReminderDateField: e.target.value } : f))} className="w-full p-2 border rounded" data-testid={`edit-form-reminder-date-field-${form.id}`}>
                    {editDateFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
  
              <button type="button" className="px-4 py-2 bg-green-500 text-white rounded" onClick={() => handleUpdateForm(form)}>
                変更
              </button>
            </div>
          )
        })}
      </div>

        {showCreateForm && (
          <div>
            <h2 className="text-lg font-semibold mb-4">フォーム作成</h2>
            <div className="space-y-2">
              <div>
                <label>フォーム名</label>
                <input type="text" className="w-full p-2 border rounded" onChange={(e) => setCreateForm({...createForm, name: e.target.value})} data-testid="create-form-name"/>
              </div>
              <div>
                <label>説明</label>
                <textarea className="w-full p-2 border rounded" onChange={(e) => setCreateForm({...createForm, description: e.target.value})} data-testid="create-form-description"></textarea>
              </div>
              <div>
                <label>フィールド定義（JSON形式）</label>
                <textarea className="w-full p-2 border rounded" onChange={(e) => setFieldsJson(e.target.value)} data-testid="create-form-fields"></textarea>
              </div>
              <div>
                <label>送信時タグ付与（タグID）</label>
                <input type="text" className="w-full p-2 border rounded" onChange={(e) => setCreateForm({...createForm, onSubmitTagId: e.target.value})} data-testid="create-form-tag-id"/>
              </div>
              <div>
                <label>送信時シナリオ登録（シナリオID）</label>
                <input type="text" className="w-full p-2 border rounded" onChange={(e) => setCreateForm({...createForm, onSubmitScenarioId: e.target.value})} data-testid="create-form-scenario-id"/>
              </div>
              <label className="mr-2">メタデータを保存</label>
              <input type="checkbox" className="p-2 border rounded" onChange={(e) => setCreateForm({...createForm, saveToMetadata: e.target.checked})} data-testid="create-form-save-to-metadata" />

              <div className="space-y-2">
                <h3>送信時にリマインダへ登録</h3>
                <div>
                  <label>リマインダ選択</label>
                  <select value={createForm.onSubmitReminderId} onChange={(e) => setCreateForm({...createForm, onSubmitReminderId: e.target.value})} className="w-full p-2 border rounded" data-testid="create-form-reminder-id">
                    {reminders.map((reminder) => (
                      <option key={reminder.id} value={reminder.id}>
                        {reminder.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>基準日として使うフィールドの選択</label>
                  <select value={createForm.onSubmitReminderDateField} onChange={(e) => setCreateForm({...createForm, onSubmitReminderDateField: e.target.value})} className="w-full p-2 border rounded" data-testid="create-form-reminder-date-field">
                    {createDateFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="button" className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => {handleCreateForm(createForm)}} data-testid="create-form-submit">
                作成
              </button>
              <button type="button" className="px-4 py-2 bg-red-500 text-white rounded" onClick={() => {setShowCreateForm(false)}}>
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
