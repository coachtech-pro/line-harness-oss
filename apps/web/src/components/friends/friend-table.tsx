'use client'

import { Fragment, useState } from 'react'
import type { Tag } from '@line-crm/shared'
import type { FriendWithTags } from '@/lib/api'
import { api } from '@/lib/api'
import TagBadge from './tag-badge'

interface FriendTableProps {
  friends: FriendWithTags[]
  allTags: Tag[]
  onRefresh: () => void
}

interface AddNewTag {
  name: string
  color: string
}

export default function FriendTable({ friends, allTags, onRefresh }: FriendTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addingTagForFriend, setAddingTagForFriend] = useState<string | null>(null)
  const [selectedTagId, setSelectedTagId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addNewTagForm, setAddNewTagForm] = useState(false)
  const [addNewTag, setAddNewTag] = useState<AddNewTag>({ name: '', color: '' })

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
    setAddingTagForFriend(null)
    setSelectedTagId('')
    setError('')
    setAddNewTagForm(false)
    setAddNewTag({ name: '', color: '' })
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

  const handleAddNewTag = async (friendId: string) => {
    if (!addNewTag.name) return
    setLoading(true)
    setError('')
    try {
      const res = await api.tags.create({ name: addNewTag.name, color: addNewTag.color || undefined })
      if (res.success) {
        const newTagId = res.data.id
        await api.friends.addTag(friendId, newTagId)
      }
      setAddNewTagForm(false)
      setAddNewTag({ name: '', color: '' })
      setAddingTagForFriend(null)
      onRefresh()
    } catch {
      setError('タグの作成に失敗しました')
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
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
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

                          {isAddingTag && (
                            <div className="space-y-4">
                              {availableTags.length > 0 && (
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
                              )}
                              <div>
                                <button onClick={() => setAddNewTagForm(true)} className="text-xs text-gray-500 mb-2">+ 新規タグを作成</button>
                                {addNewTagForm && (
                                  <div className="flex items-center gap-2">
                                    <label htmlFor="new-tag-name" className="text-xs text-gray-500">名前</label>
                                    <input
                                      type="text"
                                      id="new-tag-name"
                                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                                      onChange={(e) => setAddNewTag({ ...addNewTag, name: e.target.value })}
                                    />
                                    <label htmlFor="new-tag-color" className="text-xs text-gray-500">色</label>
                                    <input
                                      type="text"
                                      id="new-tag-color"
                                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                                      onChange={(e) => setAddNewTag({ ...addNewTag, color: e.target.value })}
                                    />
                                    <button
                                      onClick={() => handleAddNewTag(friend.id)}
                                      className="px-3 py-1 text-xs font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors"
                                    >
                                      保存
                                    </button>
                                    <button
                                      onClick={() => setAddNewTagForm(false)}
                                      className="px-3 py-1 text-xs font-medium rounded-md text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors"
                                    >
                                      キャンセル
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setAddingTagForFriend(friend.id); if (availableTags.length === 0) setAddNewTagForm(true); }}
                              className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              タグを追加
                            </button>
                            <div>
                              <p className="text-xs text-gray-500 mb-2">タグ一覧</p>
                              {allTags.length === 0 ? (
                                <p className="text-xs text-gray-500 mb-2">タグがありません</p>
                              ) : (
                                <ul className="space-y-1 text-xs text-gray-500">
                                  {allTags.map((tag) => (
                                    <li key={tag.id}>{tag.name}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
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
