'use client'

import { useState, useEffect } from 'react'
import { Character } from '../../lib/types/character'

interface CharacterResponse {
  success: boolean
  message: string
  data: {
    characters: Character[]
    stats: {
      total: number
      successful: number
      failed: number
      fromCache: boolean
    }
  }
  error?: string
}

export default function CharactersPage(): JSX.Element {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [stats, setStats] = useState<CharacterResponse['data']['stats'] | null>(null)
  const [league, setLeague] = useState('Standard')
  const [limit, setLimit] = useState(50)
  const [poesessid, setPoeSessionId] = useState('')
  const [hasValidSession, setHasValidSession] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)

  const fetchCharacters = async (): Promise<void> => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/characters/fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ league, limit }),
      })

      const data: CharacterResponse = await response.json()

      if (data.success) {
        setCharacters(data.data.characters)
        setStats(data.data.stats)
      } else {
        setError(data.error || 'Failed to fetch characters')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async (): Promise<void> => {
    try {
      const response = await fetch('/api/session')
      const data = await response.json()
      setHasValidSession(data.hasValidSession)
    } catch (err) {
      console.error('Failed to check session:', err)
    }
  }

  const storeSession = async (): Promise<void> => {
    setSessionLoading(true)
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ poesessid }),
      })

      const data = await response.json()
      if (data.success) {
        setHasValidSession(true)
        setPoeSessionId('')
        setError('')
      } else {
        setError(data.error || 'Failed to store session')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSessionLoading(false)
    }
  }

  const clearSession = async (): Promise<void> => {
    try {
      await fetch('/api/session', { method: 'DELETE' })
      setHasValidSession(false)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    checkSession()
    fetchCharacters()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Character Data Viewer</h1>

        {/* Session Management */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">PoE Session Authentication</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className={`inline-block w-3 h-3 rounded-full ${hasValidSession ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium">
              {hasValidSession ? 'Session Active' : 'No Session'}
            </span>
          </div>

          {!hasValidSession ? (
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  POESESSID (Required for character item data)
                </label>
                <input
                  type="password"
                  value={poesessid}
                  onChange={(e) => setPoeSessionId(e.target.value)}
                  placeholder="Enter your POESESSID from browser cookies"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Copy from your browser's cookies while logged in to pathofexile.com
                </p>
              </div>
              <button
                onClick={storeSession}
                disabled={sessionLoading || !poesessid.trim()}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {sessionLoading ? 'Storing...' : 'Store Session'}
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <span className="text-green-600">✓ Session authenticated - character items should now be available</span>
              <button
                onClick={clearSession}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Clear Session
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                League
              </label>
              <select
                value={league}
                onChange={(e) => setLeague(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="Standard">Standard</option>
                <option value="Settlers">Settlers</option>
                <option value="Hardcore">Hardcore</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limit
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                min="1"
                max="200"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={fetchCharacters}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Fetch Characters'}
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Fetch Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
                <div className="text-sm text-gray-600">With Items</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-gray-600">Private/Failed</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-600">
                  {stats.fromCache ? '✓ From Cache' : '✓ Fresh Data'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-800 font-medium">Error</div>
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* Characters List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              Characters ({characters.length})
            </h2>
          </div>

          {characters.length === 0 && !loading && (
            <div className="p-6 text-center text-gray-500">
              No characters loaded. Click "Fetch Characters" to load data.
            </div>
          )}

          {characters.map((character) => (
            <div key={character.id} className="border-b border-gray-200 last:border-b-0">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {character.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Level {character.level} {character.class} • {character.league}
                    </p>
                    <p className="text-xs text-gray-500">
                      Account: {character.accountName}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      Items: <span className="font-semibold">{character.items.length}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {character.fetchedAt ? new Date(character.fetchedAt).toLocaleString() : 'No fetch time'}
                    </div>
                  </div>
                </div>

                {/* Items Preview */}
                {character.items.length > 0 ? (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Items ({character.items.length})
                    </h4>
                    <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                      <div className="space-y-1">
                        {character.items.slice(0, 10).map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-700">
                            <span className="font-medium">{item.name || item.baseType}</span>
                            {item.category && (
                              <span className="text-gray-500 ml-2">({item.category})</span>
                            )}
                          </div>
                        ))}
                        {character.items.length > 10 && (
                          <div className="text-xs text-gray-500">
                            ... and {character.items.length - 10} more items
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-yellow-50 rounded">
                    <div className="text-sm text-yellow-800">
                      <strong>No items available</strong> - This character profile is likely private
                    </div>
                  </div>
                )}

                {/* Raw Data Toggle */}
                <details className="mt-4">
                  <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                    View Raw Character Data
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-900 text-green-400 text-xs overflow-auto rounded max-h-60">
                    {JSON.stringify(character, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}