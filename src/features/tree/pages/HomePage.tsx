import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getApiErrorMessage, isForbiddenError, refreshCurrentUser } from '../../../services/api'
import {
  getApiErrorCode,
  getMemberCard,
  getMemberDetails,
  getTreeAccess,
  getTreeBranch,
  getTreeOverview,
  type MemberCard,
  type MemberDetails,
  type Tree,
  type TreeAccess,
} from '../../../services/treeApi'
import { AccessRequestPanel } from '../components/AccessRequestPanel'
import { MemberFormModal } from '../components/MemberFormModal'
import { PersonDetailModal } from '../components/PersonDetailModal'
import { TreeCanvas } from '../components/TreeCanvas'
import { TreeListView } from '../components/TreeListView'
import { TreeSidebar } from '../components/TreeSidebar'
import { TreeTopBar } from '../components/TreeTopBar'
import { mapBranchToPeople, mapOverviewToPeople } from '../data/apiMapping'
import { BranchType, Person, TreeStats } from '../types'

type TreeScope =
  | { type: 'overview' }
  | {
      type: 'focus'
      nodeId: string
      nodeName: string
      path: Person[]
    }

const EMPTY_STATS: TreeStats = {
  membersCount: 0,
  generationsCount: 0,
  branchesCount: 0,
  countriesCount: 0,
  livingCount: 0,
}

const ALL_TREES: Tree[] = ['EGYPT', 'JORDAN']

const normalizeTreeAccess = (access: TreeAccess[]): TreeAccess[] =>
  ALL_TREES.map((tree) => ({
    tree,
    hasAccess: access.find((item) => item.tree === tree)?.hasAccess ?? false,
  }))

export function HomePage() {
  const location = useLocation()
  const token = localStorage.getItem('auth_token')

  const [treeAccess, setTreeAccess] = useState<TreeAccess[]>([])
  const [isLoadingAccess, setIsLoadingAccess] = useState(true)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [accessReloadKey, setAccessReloadKey] = useState(0)
  const [activeTree, setActiveTree] = useState<Tree>('EGYPT')
  const [scope, setScope] = useState<TreeScope>({ type: 'overview' })

  const [people, setPeople] = useState<Person[]>([])
  const [stats, setStats] = useState<TreeStats>(EMPTY_STATS)
  const [isLoadingTree, setIsLoadingTree] = useState(false)
  const [treeError, setTreeError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [memberCard, setMemberCard] = useState<MemberCard | null>(null)
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null)
  const [isLoadingCard, setIsLoadingCard] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)
  const cardRequestRef = useRef(0)
  const detailsRequestRef = useRef(0)

  const [editor, setEditor] = useState<{
    mode: 'edit' | 'add-child'
    person: Person
  } | null>(null)
  const [notice, setNotice] = useState<{
    type: 'success' | 'info' | 'error'
    message: string
  } | null>(null)

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false)
  const [isListView, setIsListView] = useState(false)

  const activeAccess =
    treeAccess.find((item) => item.tree === activeTree)?.hasAccess ?? false
  const lockedBranches = treeAccess
    .filter((item) => !item.hasAccess)
    .map((item) => (item.tree === 'EGYPT' ? 'Egypt' : 'Jordan'))

  const generations = useMemo(
    () => Array.from(new Set(people.map((person) => person.generation))).sort((a, b) => a - b),
    [people],
  )

  useEffect(() => {
    if (!token) return
    let isMounted = true
    setIsLoadingAccess(true)
    setAccessError(null)

    const loadAccess = async () => {
      try {
        const [meResult, accessResult] = await Promise.allSettled([
          refreshCurrentUser(),
          getTreeAccess(),
        ])

        if (!isMounted) return

        let grantedTrees: string[] = []
        let isSuperAdmin = false

        if (meResult.status === 'fulfilled' && meResult.value) {
          const me = meResult.value
          isSuperAdmin = String(me.user.role || '').toUpperCase() === 'SUPER_ADMIN'
          grantedTrees = me.trees || me.user.trees || []
        } else {
          try {
            const local = JSON.parse(localStorage.getItem('user_info') || '{}')
            isSuperAdmin = String(local.role || '').toUpperCase() === 'SUPER_ADMIN'
            grantedTrees = local.trees || []
          } catch {
            // ignore
          }
        }

        const treeApiAccess =
          accessResult.status === 'fulfilled' ? accessResult.value : []

        // Compute access: SUPER_ADMIN automatically gets both trees;
        // ADMIN, CONTRIBUTOR, and USER only get actual granted trees
        const computedAccess: TreeAccess[] = ALL_TREES.map((tree) => {
          if (isSuperAdmin) {
            return { tree, hasAccess: true }
          }

          // Check if GET /api/trees returned explicit hasAccess
          const fromApi = treeApiAccess.find((item) => item.tree === tree)
          if (fromApi !== undefined) {
            return { tree, hasAccess: Boolean(fromApi.hasAccess) }
          }

          // Fallback to GET /api/auth/me trees
          const hasGrant = grantedTrees.some(
            (t) => String(t).toUpperCase() === tree,
          )
          return { tree, hasAccess: hasGrant }
        })

        setTreeAccess(computedAccess)
      } catch (error) {
        if (!isMounted) return
        if (getApiErrorCode(error) === 'TREE_ACCESS_REQUIRED') {
          setTreeAccess(normalizeTreeAccess([]))
          return
        }
        if (isForbiddenError(error)) {
          await refreshCurrentUser()
        }
        setAccessError(getApiErrorMessage(error))
      } finally {
        if (isMounted) setIsLoadingAccess(false)
      }
    }

    loadAccess()

    return () => {
      isMounted = false
    }
  }, [token, accessReloadKey])

  useEffect(() => {
    if (!token || isLoadingAccess) return
    if (treeAccess.find((item) => item.tree === activeTree)?.hasAccess) return
    const firstAccessible = treeAccess.find((item) => item.hasAccess)
    if (firstAccessible) setActiveTree(firstAccessible.tree)
  }, [token, isLoadingAccess, treeAccess, activeTree])

  useEffect(() => {
    if (!token || isLoadingAccess) return
    if (!activeAccess) {
      setPeople([])
      setStats(EMPTY_STATS)
      setTreeError(null)
      setIsLoadingTree(false)
      return
    }

    let isMounted = true
    setIsLoadingTree(true)
    setTreeError(null)

    const load = async () => {
      try {
        if (scope.type === 'overview') {
          const overview = await getTreeOverview(activeTree)
          if (!isMounted) return
          const mapped = mapOverviewToPeople(
            activeTree,
            overview.roots,
            treeAccess.length || 1,
          )
          setPeople(mapped.people)
          setStats(mapped.stats)
        } else {
          const focusPerson = scope.path[scope.path.length - 1]
          const focusGeneration = focusPerson.generation
          const branch = await getTreeBranch(activeTree, scope.nodeId, 1)
          if (!isMounted) return
          const mapped = mapBranchToPeople(
            activeTree,
            branch.branch,
            treeAccess.length || 1,
            focusGeneration,
          )
          const focused = mapped.people.map((person, index) =>
            index === 0
              ? {
                  ...person,
                  parentIds:
                    scope.path.length > 1
                      ? [scope.path[scope.path.length - 2].id]
                      : [],
                }
              : person,
          )
          const ancestors: Person[] = scope.path.slice(0, -1).map((person, i) => ({
            ...person,
            parentIds: i > 0 ? [scope.path[i - 1].id] : [],
            childrenIds: [scope.path[i + 1].id],
            childrenCount: 1,
            isContextParent: true,
          }))
          const withPath: Person[] = [...ancestors, ...focused]
          setPeople(withPath)
          setStats({ ...mapped.stats, membersCount: withPath.length })
        }
      } catch (error) {
        if (!isMounted) return
        if (getApiErrorCode(error) === 'TREE_ACCESS_REQUIRED') {
          setTreeAccess((prev) =>
            prev.map((item) =>
              item.tree === activeTree ? { ...item, hasAccess: false } : item,
            ),
          )
        }
        if (isForbiddenError(error)) {
          await refreshCurrentUser()
          setAccessReloadKey((value) => value + 1)
        }
        setTreeError(getApiErrorMessage(error))
        setPeople([])
        setStats(EMPTY_STATS)
      } finally {
        if (isMounted) setIsLoadingTree(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [token, isLoadingAccess, activeAccess, activeTree, scope, reloadKey, treeAccess.length])

  const clearMember = () => {
    cardRequestRef.current += 1
    detailsRequestRef.current += 1
    setSelectedPerson(null)
    setMemberCard(null)
    setMemberDetails(null)
    setMemberError(null)
    setIsLoadingCard(false)
    setIsLoadingDetails(false)
  }

  const handleSelectBranch = (branch: BranchType) => {
    if (branch === 'Both') return
    setActiveTree(branch === 'Egypt' ? 'EGYPT' : 'JORDAN')
    setScope({ type: 'overview' })
    setSelectedGeneration(null)
    clearMember()
  }

  const openMember = (person: Person) => {
    setSelectedPerson(person)
    setSelectedGeneration(person.generation)
    setMemberCard(null)
    setMemberDetails(null)
    setMemberError(null)
    setIsLoadingCard(true)
    setIsLoadingDetails(false)

    const requestId = cardRequestRef.current + 1
    cardRequestRef.current = requestId
    detailsRequestRef.current += 1

    getMemberCard(person.id)
      .then((card) => {
        if (cardRequestRef.current !== requestId) return
        setMemberCard(card)
      })
      .catch((error) => {
        if (cardRequestRef.current !== requestId) return
        setMemberError(getApiErrorMessage(error))
      })
      .finally(() => {
        if (cardRequestRef.current === requestId) setIsLoadingCard(false)
      })
  }

  const focusGeneration =
    scope.type === 'overview' ? 1 : scope.path[scope.path.length - 1].generation

  const handleNodeSelect = (person: Person) => {
    const hasChildren =
      (person.childrenCount ?? 0) > 0 || (person.childrenIds?.length ?? 0) > 0

    if (!person.isContextParent && person.generation > focusGeneration && hasChildren) {
      const parent =
        person.parentIds && person.parentIds.length > 0
          ? people.find((item) => item.id === person.parentIds?.[0]) ?? null
          : null
      const nextPath: Person[] =
        scope.type === 'focus'
          ? [...scope.path, person]
          : parent
            ? [parent, person]
            : [person]
      setScope({
        type: 'focus',
        nodeId: person.id,
        nodeName: person.fullName,
        path: nextPath,
      })
      setSelectedGeneration(null)
      clearMember()
      return
    }
    openMember(person)
  }

  const handleLoadDetails = (id: string) => {
    if (!selectedPerson || isLoadingDetails) return
    setIsLoadingDetails(true)
    setMemberError(null)
    const requestId = detailsRequestRef.current + 1
    detailsRequestRef.current = requestId
    getMemberDetails(id)
      .then((details) => {
        if (detailsRequestRef.current !== requestId) return
        setMemberDetails(details)
      })
      .catch((error) => {
        if (detailsRequestRef.current !== requestId) return
        setMemberError(getApiErrorMessage(error))
      })
      .finally(() => {
        if (detailsRequestRef.current === requestId) setIsLoadingDetails(false)
      })
  }

  const handleEditorSuccess = (message: string, saved: boolean) => {
    setNotice({ type: saved ? 'success' : 'info', message })
    if (saved) {
      setReloadKey((value) => value + 1)
      clearMember()
    }
    window.setTimeout(() => setNotice(null), 6000)
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#f5ede1] overflow-hidden font-sans">
      <TreeTopBar
        activeBranch={activeTree === 'EGYPT' ? 'Egypt' : 'Jordan'}
        onSelectBranch={handleSelectBranch}
        onToggleSidebarMobile={() => setIsSidebarOpenMobile((prev) => !prev)}
        onToggleListView={() => setIsListView((prev) => !prev)}
        isListView={isListView}
        lockedBranches={lockedBranches}
        onBack={
          scope.type === 'focus'
            ? () => {
                setScope({ type: 'overview' })
                setSelectedGeneration(null)
                clearMember()
              }
            : undefined
        }
        backLabel="All children"
      />

      <div className="flex-1 flex overflow-hidden relative">
        <div className="hidden sm:block h-full shrink-0">
          <TreeSidebar
            stats={stats}
            people={people}
            selectedGeneration={selectedGeneration}
            onSelectGeneration={(gen) => setSelectedGeneration(gen)}
            onSelectPerson={handleNodeSelect}
            generations={generations}
          />
        </div>

        {isSidebarOpenMobile && (
          <div className="fixed inset-0 z-40 sm:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsSidebarOpenMobile(false)}
            />
            <div className="fixed inset-y-0 left-0 w-[84%] max-w-[320px] bg-[#f5ede1] shadow-2xl z-50">
              <TreeSidebar
                stats={stats}
                people={people}
                selectedGeneration={selectedGeneration}
                onSelectGeneration={(gen) => setSelectedGeneration(gen)}
                onSelectPerson={handleNodeSelect}
                onCloseMobileDrawer={() => setIsSidebarOpenMobile(false)}
                generations={generations}
              />
            </div>
          </div>
        )}

        <main className="flex-1 h-full relative overflow-hidden">
          {isLoadingAccess || isLoadingTree ? (
            <div className="w-full h-full flex items-center justify-center bg-[#f5ede1]">
              <p className="text-sm font-medium text-[#7d705d]">Loading the tree…</p>
            </div>
          ) : accessError && treeAccess.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center p-6 bg-[#f5ede1]">
              <div className="max-w-md text-center">
                <p className="text-sm text-[#8a2f22] mb-3">{accessError}</p>
                <button
                  type="button"
                  onClick={() => setAccessReloadKey((value) => value + 1)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : !activeAccess ? (
            <AccessRequestPanel
              tree={activeTree}
              onRequested={() => {
                setNotice({
                  type: 'info',
                  message: 'Access request sent to the admins.',
                })
                window.setTimeout(() => setNotice(null), 6000)
              }}
            />
          ) : treeError ? (
            <div className="w-full h-full flex items-center justify-center p-6 bg-[#f5ede1]">
              <div className="max-w-md text-center">
                <p className="text-sm text-[#8a2f22] mb-3">{treeError}</p>
                <button
                  type="button"
                  onClick={() => setReloadKey((value) => value + 1)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1c1a17] text-[#f5f0e8] hover:opacity-90"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : people.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-[#f5ede1]">
              <p className="text-sm text-[#7d705d]">No members found for this tree.</p>
            </div>
          ) : isListView ? (
            <TreeListView
              people={people}
              activeBranch={activeTree === 'EGYPT' ? 'Egypt' : 'Jordan'}
              onSelectPerson={handleNodeSelect}
              onShowInfo={openMember}
            />
          ) : (
            <TreeCanvas
              people={people}
              activeBranch={activeTree === 'EGYPT' ? 'Egypt' : 'Jordan'}
              selectedGeneration={selectedGeneration}
              selectedPersonId={selectedPerson?.id || null}
              onSelectPerson={handleNodeSelect}
              onShowInfo={openMember}
            />
          )}

          {scope.type === 'focus' && (
            <div dir="rtl" className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-white/85 backdrop-blur-md border border-[#dec9ad] text-[11px] font-semibold text-[#554e42] shadow-xs">
              Viewing children of: {scope.nodeName}
            </div>
          )}

          {!isListView && people.length > 0 && (
            <div className="sm:hidden absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-1 overflow-x-auto py-1 px-2 rounded-xl bg-white/80 backdrop-blur-md border border-[#dec9ad] shadow-xs">
              <span className="text-[10px] font-bold text-[#80705a] uppercase shrink-0 mr-1">
                Gen:
              </span>
              {generations.map((gen) => (
                <button
                  key={`mobile-gen-${gen}`}
                  onClick={() =>
                    setSelectedGeneration((prev) => (prev === gen ? null : gen))
                  }
                  className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 transition-colors ${
                    selectedGeneration === gen
                      ? 'bg-[#1c1a17] text-white'
                      : 'bg-[#ebdcc7]/60 text-[#3b3021] hover:bg-[#ebdcc7]'
                  }`}
                >
                  {gen}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {notice && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl border shadow-lg text-xs font-medium flex items-center gap-3 ${
            notice.type === 'error'
              ? 'bg-[#f7e3e0] border-[#e0b4ac] text-[#8a2f22]'
              : notice.type === 'success'
                ? 'bg-[#e6efdb] border-[#bcd2a4] text-[#3e5623]'
                : 'bg-[#f3eadc] border-[#dccbb4] text-[#554e42]'
          }`}
        >
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="font-bold opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      <PersonDetailModal
        person={selectedPerson}
        allPeople={people}
        card={memberCard}
        details={memberDetails}
        isLoadingCard={isLoadingCard}
        isLoadingDetails={isLoadingDetails}
        error={memberError}
        onClose={clearMember}
        onSelectPerson={openMember}
        onLoadDetails={handleLoadDetails}
        onEdit={(person) => setEditor({ mode: 'edit', person })}
        onAddChild={(person) => setEditor({ mode: 'add-child', person })}
      />

      {editor && (
        <MemberFormModal
          mode={editor.mode}
          person={editor.person}
          card={memberCard}
          details={memberDetails}
          onClose={() => setEditor(null)}
          onSuccess={handleEditorSuccess}
        />
      )}
    </div>
  )
}
