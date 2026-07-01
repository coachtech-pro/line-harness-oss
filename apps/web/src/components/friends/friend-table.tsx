'use client'

import { Fragment, useState, useEffect } from 'react'
import type { Tag } from '@line-crm/shared'
import type { FriendWithTags } from '@/lib/api'
import { api, fetchApi } from '@/lib/api'
import TagBadge from './tag-badge'
import type { Reminder } from '@/app/friends/page'

interface FriendTableProps {
  friends: FriendWithTags[]
  allTags: Tag[]
  onRefresh: () => void
  reminders: Reminder[]
}

interface FriendReminder {
  id: string
  friendId: string
  reminderId: string
  targetDate: string
  status: 'active' | 'completed' | 'cancelled'
}

interface AddFriendReminder {
  reminderId: string
  targetDate: string
}

export default function FriendTable({ friends, allTags, onRefresh, reminders }: FriendTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addingTagForFriend, setAddingTagForFriend] = useState<string | null>(null)
  const [selectedTagId, setSelectedTagId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [friendReminders, setFriendReminders] = useState<Record<string, FriendReminder[]>>({})
  const [addFriendReminder, setAddFriendReminder] = useState<AddFriendReminder>({
    reminderId: '',
    targetDate: ''
  })

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
    setAddingTagForFriend(null)
    setSelectedTagId('')
    setError('')
  }

  const handleAddTag = async (friendId: string) => {
    if (!selectedTagId) return
    setLoading(true)
    setError('')
    try {
      await api.friends.addTag(friendId, selectedTagId)
      setAddingTagForFriend(null)
      setSelectedTagId('')
      onRefresh()
    } catch {
      setError('タグの追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTag = async (friendId: string, tagId: string) => {
    setLoading(true)
    setError('')
    try {
      await api.friends.removeTag(friendId, tagId)
      onRefresh()
    } catch {
      setError('タグの削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const loadFriendReminder = async (friendId: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchApi<{ success: boolean; data: FriendReminder[] }>(`/api/friends/${friendId}/reminders`)
      if (res.success) {
        setFriendReminders(prev => ({
          ...prev,
          [friendId]: res.data
        }))
      }
    } catch {
      setError('リマインダーの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (friends.length === 0) return
    friends.forEach(friend => {
      loadFriendReminder(friend.id)
    })
  }, [friends])

  const handleAddFriendReminder = async (friendId: string) => {
    if (!addFriendReminder.reminderId || !addFriendReminder.targetDate) return
    setLoading(true)
    setError('')
    try {
      const res = await fetchApi<{ success: boolean, data: FriendReminder }>(`/api/reminders/${addFriendReminder.reminderId}/enroll/${friendId}`, {
        method: 'POST',
        body: JSON.stringify({
          targetDate: addFriendReminder.targetDate + ':00+09:00',
        }),
      })

      if (res.success) {
        setAddFriendReminder({ reminderId: '', targetDate: '' })
        onRefresh()
      }

    } catch {
      setError('登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteFriendReminder = async (friendReminderId: string) => {
    setLoading(true)
    setError('')
    try {
      await fetchApi<{ success: boolean, data: null }>(`/api/friend-reminders/${friendReminderId}`, {
        method: 'DELETE',
      })
      onRefresh()
    } catch {
      setError('登録解除に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (friends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <p className="text-gray-500">友だちが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {error && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              アイコン / 表示名
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ステータス
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              タグ / 流入
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              登録日
            </th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {friends.map((friend) => {
            const isExpanded = expandedId === friend.id
            const isAddingTag = addingTagForFriend === friend.id
            const availableTags = allTags.filter(
              (t) => !friend.tags.some((ft) => ft.id === t.id)
            )
            const registeredReminders = friendReminders[friend.id] ?? []

            return (
              <Fragment key={friend.id}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => toggleExpand(friend.id)}
                >
                  {/* Avatar + Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {friend.pictureUrl ? (
                        <img
                          src={friend.pictureUrl}
                          alt={friend.displayName}
                          className="w-9 h-9 rounded-full object-cover bg-gray-100"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                          {friend.displayName?.charAt(0) ?? '?'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{friend.displayName}</p>
                        {friend.statusMessage && (
                          <p className="text-xs text-gray-400 truncate max-w-[160px]">{friend.statusMessage}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Following status */}
                  <td className="px-4 py-3">
                    {friend.isFollowing ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        フォロー中
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        ブロック/退会
                      </span>
                    )}
                  </td>

                  {/* Tags + Ref */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(friend as unknown as { refCode?: string }).refCode && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {(friend as unknown as { refCode: string }).refCode}
                        </span>
                      )}
                      {friend.tags.length > 0 ? (
                        friend.tags.map((tag) => <TagBadge key={tag.id} tag={tag} />)
                      ) : !((friend as unknown as { refCode?: string }).refCode) ? (
                        <span className="text-xs text-gray-400">なし</span>
                      ) : null}
                    </div>
                  </td>

                  {/* Registered date */}
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(friend.createdAt)}
                  </td>

                  {/* Expand indicator */}
                  <td className="px-4 py-3 text-right">
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform inline-block ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24" data-testid={`expanded-icon-${friend.id}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </td>
                </tr>

                {/* Expanded detail row */}
                {isExpanded && (
                  <tr className="bg-gray-50">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">LINE ユーザーID</p>
                          <p className="text-xs text-gray-600 font-mono">{friend.lineUserId}</p>
                        </div>

                        {/* Tag management */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">タグ管理</p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {friend.tags.map((tag) => (
                              <TagBadge
                                key={tag.id}
                                tag={tag}
                                onRemove={() => handleRemoveTag(friend.id, tag.id)}
                              />
                            ))}
                          </div>

                          {isAddingTag ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <select
                                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={selectedTagId}
                                onChange={(e) => setSelectedTagId(e.target.value)}
                              >
                                <option value="">タグを選択...</option>
                                {availableTags.map((tag) => (
                                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAddTag(friend.id)}
                                disabled={!selectedTagId || loading}
                                className="px-3 py-1 text-xs font-medium rounded-md text-white disabled:opacity-50 transition-opacity"
                                style={{ backgroundColor: '#06C755' }}
                              >
                                追加
                              </button>
                              <button
                                onClick={() => { setAddingTagForFriend(null); setSelectedTagId('') }}
                                className="px-3 py-1 text-xs font-medium rounded-md text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
                              >
                                キャンセル
                              </button>
                            </div>
                          ) : (
                            availableTags.length > 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setAddingTagForFriend(friend.id) }}
                                className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                タグを追加
                              </button>
                            )
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">リマインダ管理</p>
                          <div className="flex items-center gap-3">
                            <select
                              className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              value={addFriendReminder.reminderId}
                              onChange={(e) => setAddFriendReminder({ ...addFriendReminder, reminderId: e.target.value })}
                              data-testid="reminders-select"
                            >
                              <option value="">リマインダを選択</option>
                              {reminders.map((reminder) => (
                                <option key={reminder.id} value={reminder.id}>
                                  {reminder.name}
                                </option>
                              ))}
                            </select>
                            <div>
                              <label className="text-xs text-gray-500">基準日</label>
                              <input
                                type="datetime-local"
                                className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={addFriendReminder.targetDate}
                                onChange={(e) => setAddFriendReminder({ ...addFriendReminder, targetDate: e.target.value })}
                                data-testid="target-date-input"
                              />
                            </div>
                            <button
                              className="px-2 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                              onClick={() => handleAddFriendReminder(friend.id)}
                              data-testid="add-reminder-button"
                            >
                              登録
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">登録中のリマインダ一覧</p>
                          {(registeredReminders.length === 0) ? (
                            <p className="text-xs text-gray-500">登録中のリマインダはありません</p>
                          ) : (
                            <table className="space-y-2" data-testid="registered-reminders-table">
                              <thead>
                                <tr className="font-semibold text-xs text-gray-500 text-left">
                                  <th className="pr-4 py-1">リマインダ名</th>
                                  <th className="px-4 py-1">基準日</th>
                                  <th className="px-4 py-1">状態</th>
                                  <th className="px-4 py-1"></th>
                                </tr>
                              </thead>
                              <tbody>
                              {registeredReminders.map((registeredReminder) => (
                                <tr key={registeredReminder.id} className="text-xs text-gray-500 text-left">
                                  <td className="pr-4 py-1">{reminders.find((reminder) => reminder.id === registeredReminder.reminderId)?.name}</td>
                                  <td className="px-4 py-1">{formatDate(registeredReminder.targetDate)}</td>
                                  <td className="px-4 py-1">{registeredReminder.status}</td>
                                  <td className="px-4 py-1">
                                    <button
                                      onClick={() => handleDeleteFriendReminder(registeredReminder.id)}
                                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                      data-testid={`delete-friend-reminder-button-${registeredReminder.id}`}
                                    >
                                      解除
                                    </button>
                                  </td>
                                </tr>
                              ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
      </div>
    </div>
  )
}
