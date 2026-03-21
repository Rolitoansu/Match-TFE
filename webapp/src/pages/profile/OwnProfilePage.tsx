import {
  User,
  Settings,
  Mail,
  PencilLine,
  FileText,
  Plus,
  Calendar,
  ChevronRight,
  Users,
  Hash,
  X,
  ChevronDown,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import useAuth from '../../hooks/useAuth'
import type { ProfileData, Proposal, TagOption } from './types'

export default function OwnProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [aboutMe, setAboutMe] = useState('')
  const [isEditingAboutMe, setIsEditingAboutMe] = useState(false)
  const [savingAboutMe, setSavingAboutMe] = useState(false)
  const [aboutMeError, setAboutMeError] = useState<string | null>(null)
  const [aboutMeSuccess, setAboutMeSuccess] = useState<string | null>(null)
  const [availableTags, setAvailableTags] = useState<TagOption[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [isEditingInterests, setIsEditingInterests] = useState(false)
  const [savingInterests, setSavingInterests] = useState(false)
  const [interestsError, setInterestsError] = useState<string | null>(null)
  const [interestsSuccess, setInterestsSuccess] = useState<string | null>(null)
  const [interestSearch, setInterestSearch] = useState('')
  const [debouncedInterestSearch, setDebouncedInterestSearch] = useState('')
  const [interestInputFocused, setInterestInputFocused] = useState(false)
  const interestInputRef = useRef<HTMLInputElement>(null)
  const interestSuggestionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const userId = user?.id

    if (!userId) {
      return
    }

    async function fetchUserData() {
      try {
        const [proposalsResponse, profileResponse, tagsResponse] = await Promise.all([
          api.get(`/user/proposals/${userId}`),
          api.get('/user/profile'),
          api.get('/project/tags'),
        ])

        setProposals(proposalsResponse.data.proposals)

        const profile: ProfileData = profileResponse.data.user
        setAboutMe(profile.biography ?? '')
        setSelectedInterests(profile.interests ?? [])

        setAvailableTags(tagsResponse.data.tags ?? [])
      } catch (error) {
        console.error('Error al obtener las propuestas del usuario:', error)
      }
    }

    fetchUserData()
  }, [user?.id])

  useEffect(() => {
    setAboutMe(user?.biography ?? '')
  }, [user?.biography])

  useEffect(() => {
    if (!aboutMeSuccess) {
      return
    }

    const timeoutId = setTimeout(() => {
      setAboutMeSuccess(null)
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [aboutMeSuccess])

  useEffect(() => {
    if (!interestsSuccess) {
      return
    }

    const timeoutId = setTimeout(() => {
      setInterestsSuccess(null)
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [interestsSuccess])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInterestSearch(interestSearch), 300)
    return () => clearTimeout(timer)
  }, [interestSearch])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        interestInputRef.current && !interestInputRef.current.contains(e.target as Node) &&
        interestSuggestionRef.current && !interestSuggestionRef.current.contains(e.target as Node)
      ) {
        setInterestInputFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function saveAboutMe() {
    setSavingAboutMe(true)
    setAboutMeError(null)
    setAboutMeSuccess(null)

    try {
      await api.patch('/user/profile', { biography: aboutMe.trim() || null })
      setIsEditingAboutMe(false)
      setAboutMeSuccess('Tu perfil se ha actualizado correctamente.')
    } catch (error) {
      console.error('Error actualizando sobre mi:', error)
      setAboutMeError('No se pudo actualizar tu biografia. Intentalo de nuevo.')
    } finally {
      setSavingAboutMe(false)
    }
  }

  function toggleInterest(tagName: string) {
    setSelectedInterests((previous) => {
      if (previous.includes(tagName)) {
        return previous.filter((value) => value !== tagName)
      }

      return [...previous, tagName]
    })
  }

  function highlightMatch(text: string, query: string) {
    if (!query.trim()) return <span>{text}</span>
    const idx = text.toLowerCase().indexOf(query.trim().toLowerCase())
    if (idx === -1) return <span>{text}</span>

    return (
      <span>
        {text.slice(0, idx)}
        <mark className="bg-primary/20 text-primary rounded px-0.5">{text.slice(idx, idx + query.trim().length)}</mark>
        {text.slice(idx + query.trim().length)}
      </span>
    )
  }

  async function saveInterests() {
    setSavingInterests(true)
    setInterestsError(null)
    setInterestsSuccess(null)

    try {
      await api.patch('/user/profile', { interests: selectedInterests })
      setIsEditingInterests(false)
      setInterestsSuccess('Intereses actualizados correctamente.')
    } catch (error) {
      console.error('Error actualizando intereses:', error)
      setInterestsError('No se pudieron actualizar los intereses. Intentalo de nuevo.')
    } finally {
      setSavingInterests(false)
    }
  }

  return (
    <div className="max-w-350 mx-auto p-6 lg:p-10">
      <div className="flex justify-between items-end mb-10 px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mi Panel de Control</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestiona tu perfil y tus propuestas de TFE</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
          onClick={() => navigate('/proposals/new')}>
          <Plus size={18} />
          Nueva Propuesta
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-4 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <div className="h-22 w-22 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                  <User size={42} strokeWidth={1.5} />
                </div>
                <button className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-white border border-border rounded-lg shadow-sm text-primary hover:bg-primary hover:text-white transition-colors">
                  <PencilLine size={14} />
                </button>
              </div>

              <h2 className="text-xl font-bold">{user!.name}</h2>
              <p className="text-primary font-semibold text-xs mb-1">{user!.role === 'professor' ? 'Profesor/a' : 'Estudiante'}</p>

              <div className="flex items-center gap-2 mt-3 px-3 py-1 bg-secondary/50 rounded-full text-[11px] text-muted-foreground">
                <Mail size={11} />
                <span>{user!.email}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 border-y border-border/50 py-6 text-center">
              <div>
                <p className="text-lg font-bold">0</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Matches</p>
              </div>
              <div>
                <p className="text-lg font-bold">{proposals?.length ?? 0}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">TFEs</p>
              </div>

            </div>

            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-between">
                  Sobre mi
                  <button
                    type="button"
                    className="text-primary hover:opacity-80 transition-opacity"
                    onClick={() => {
                      setIsEditingAboutMe((prev) => !prev)
                      setAboutMeError(null)
                      setAboutMeSuccess(null)
                    }}
                  >
                    <PencilLine size={12} className="cursor-pointer" />
                  </button>
                </h3>

                {isEditingAboutMe ? (
                  <div className="space-y-2">
                    <textarea
                      value={aboutMe}
                      onChange={(event) => setAboutMe(event.target.value)}
                      maxLength={2000}
                      rows={4}
                      className="w-full rounded-xl border border-border bg-white p-3 text-sm leading-relaxed outline-none focus:border-primary/50"
                      placeholder="Cuentanos brevemente sobre ti, tus intereses y objetivos de TFE."
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{aboutMe.length}/2000</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-border px-3 py-1.5 font-semibold hover:bg-secondary transition-colors"
                          onClick={() => {
                            setIsEditingAboutMe(false)
                            setAboutMe(user?.biography ?? '')
                            setAboutMeError(null)
                          }}
                          disabled={savingAboutMe}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                          onClick={saveAboutMe}
                          disabled={savingAboutMe}
                        >
                          {savingAboutMe ? 'Guardando...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-foreground/80 italic">
                    "{aboutMe || 'Todavia no has escrito informacion sobre ti.'}"
                  </p>
                )}

                {aboutMeError && <p className="mt-2 text-xs text-red-600">{aboutMeError}</p>}
                {aboutMeSuccess && <p className="mt-2 text-xs text-green-600">{aboutMeSuccess}</p>}
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-between">
                  Intereses
                  <button
                    type="button"
                    className="text-primary hover:opacity-80 transition-opacity"
                    onClick={() => {
                      setIsEditingInterests((prev) => !prev)
                      setInterestsError(null)
                      setInterestsSuccess(null)
                    }}
                  >
                    <PencilLine size={12} className="cursor-pointer" />
                  </button>
                </h3>

                {isEditingInterests ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Anade etiquetas para personalizar que TFEs aparecen en explorar.</p>

                    {selectedInterests.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedInterests.map((tag) => (
                          <span key={tag} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-bold border border-primary/20 animate-in fade-in slide-in-from-top-1 duration-150">
                            {tag}
                            <button type="button" onClick={() => toggleInterest(tag)} className="p-0.5 hover:bg-primary/20 rounded-md transition-colors">
                              <X size={13} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={15} />
                      <input
                        ref={interestInputRef}
                        type="text"
                        placeholder="Buscar y anadir intereses..."
                        className={`w-full pl-10 pr-9 py-3 rounded-xl bg-slate-50 border transition-all text-sm outline-none ${
                          interestInputFocused
                            ? 'border-primary/50 bg-white ring-4 ring-primary/5'
                            : 'border-transparent hover:border-border'
                        }`}
                        value={interestSearch}
                        onChange={(e) => setInterestSearch(e.target.value)}
                        onFocus={() => setInterestInputFocused(true)}
                        autoComplete="off"
                      />
                      <ChevronDown
                        size={15}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-transform duration-200 ${
                          interestInputFocused ? 'rotate-180' : ''
                        }`}
                      />

                      {interestInputFocused && (() => {
                        const selectedSet = new Set(selectedInterests)
                        const filtered = availableTags
                          .map((tag) => tag.name)
                          .filter((tag) => !selectedSet.has(tag)
                            && (!debouncedInterestSearch.trim()
                              || tag.toLowerCase().includes(debouncedInterestSearch.trim().toLowerCase())))
                        const searching = debouncedInterestSearch.trim().length > 0

                        return (
                          <div
                            ref={interestSuggestionRef}
                            className="absolute z-60 bottom-full left-0 right-0 mb-1.5 bg-white border border-border rounded-2xl shadow-xl shadow-slate-200/70 overflow-hidden"
                          >
                            <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {searching ? 'Resultados' : 'Disponibles'}
                              </span>
                              {filtered.length > 0 && (
                                <span className="text-[10px] font-semibold text-muted-foreground bg-slate-100 rounded-full px-2 py-0.5">
                                  {filtered.length}
                                </span>
                              )}
                            </div>

                            {filtered.length > 0 ? (
                              <div className="max-h-48 overflow-y-auto">
                                {filtered.map((tag, i) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                      toggleInterest(tag)
                                      setInterestSearch('')
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium text-foreground hover:bg-primary/5 hover:text-primary transition-colors ${
                                      i !== filtered.length - 1 ? 'border-b border-border/40' : ''
                                    }`}
                                  >
                                    {highlightMatch(tag, debouncedInterestSearch)}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="px-4 py-4 text-center">
                                <p className="text-sm text-muted-foreground">
                                  {searching
                                    ? `No hay etiquetas que coincidan con "${debouncedInterestSearch}".`
                                    : 'Ya has anadido todas las etiquetas disponibles.'}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition-colors"
                        onClick={() => {
                          setIsEditingInterests(false)
                          setInterestSearch('')
                          setInterestInputFocused(false)
                        }}
                        disabled={savingInterests}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                        onClick={saveInterests}
                        disabled={savingInterests}
                      >
                        {savingInterests ? 'Guardando...' : 'Guardar intereses'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.length > 0 ? selectedInterests.map((interest) => (
                      <span key={interest} className="text-[10px] font-semibold px-2 py-1 bg-secondary rounded-full text-muted-foreground border border-border/60">
                        #{interest}
                      </span>
                    )) : (
                      <p className="text-sm italic text-foreground/70">Todavia no has definido intereses.</p>
                    )}
                  </div>
                )}

                {interestsError && <p className="mt-2 text-xs text-red-600">{interestsError}</p>}
                {interestsSuccess && <p className="mt-2 text-xs text-green-600">{interestsSuccess}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FileText className="text-primary" size={20} />
              Mis TFEs Publicados
            </h3>
            <div className="flex gap-2">
              <button className="p-2 text-muted-foreground hover:text-primary transition-colors"><Settings size={18} /></button>
            </div>
          </div>

          <div className="grid gap-4">
            {proposals?.map((proposal) => (
              <div key={proposal.id} className="group bg-card border border-border rounded-3xl p-6 hover:border-primary/40 hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        proposal.status === 'Abierto' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {proposal.status}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Calendar size={12} /> {new Date(proposal.publicationDate).toLocaleString()}
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {proposal.title}
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {proposal.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-medium px-2 py-0.5 bg-secondary rounded text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-8">
                    <div className="text-center">
                      <div className="flex items-center gap-1.5 text-primary mb-1 justify-center">
                        <Users size={16} />
                        <span className="text-lg font-black">{'3'}</span>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Candidatos</p>
                    </div>
                    <button className="p-3 rounded-2xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all"
                      onClick={() => { navigate(`/proposals/details/${proposal.id}`) }}>
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {proposals?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-border">
              <FileText size={48} className="text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Aun no has publicado ninguna propuesta</p>
              <a className="mt-4 text-primary font-bold text-sm hover:underline" href="/proposals/new">Crear mi primera propuesta</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
