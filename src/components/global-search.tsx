"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, FileText, Database, Zap, TrendingUp, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchResult {
  id: string
  type: 'datasource' | 'chart' | 'optimization' | 'report'
  title: string
  description: string
  metadata?: any
  url?: string
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recent_searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (query.length >= 2) {
      searchData(query)
    } else {
      setResults([])
    }
  }, [query])

  const searchData = useCallback(async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const result = await response.json()
      
      if (result.success) {
        setResults(result.data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const updated = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recent_searches', JSON.stringify(updated))

    // Navigate if URL provided
    if (result.url) {
      window.location.href = result.url
    }
    
    onOpenChange(false)
  }

  const handleRecentSearchClick = (search: string) => {
    setQuery(search)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'datasource':
        return <Database className="w-4 h-4 text-blue-500" />
      case 'chart':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'optimization':
        return <Zap className="w-4 h-4 text-yellow-500" />
      case 'report':
        return <FileText className="w-4 h-4 text-purple-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      datasource: 'bg-blue-100 text-blue-700',
      chart: 'bg-green-100 text-green-700',
      optimization: 'bg-yellow-100 text-yellow-700',
      report: 'bg-purple-100 text-purple-700',
    }
    return (
      <Badge variant="secondary" className={colors[type] || ''}>
        {type}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle>Global Search</DialogTitle>
          <DialogDescription>
            Search across data sources, charts, optimizations, and reports
          </DialogDescription>
        </DialogHeader>

        <div className="px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px] px-6 pb-6">
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Searches</h3>
              {recentSearches.map((search, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => handleRecentSearchClick(search)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  {search}
                </Button>
              ))}
            </div>
          )}

          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No results found for "{query}"</p>
              <p className="text-sm text-muted-foreground mt-2">Try different keywords</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-1 mt-4">
              {results.map((result) => (
                <Button
                  key={result.id}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-4 hover:bg-accent group"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className="mt-0.5">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">{result.title}</h4>
                        {getTypeBadge(result.type)}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{result.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground">
            <kbd className="px-2 py-1 bg-background rounded border">Ctrl</kbd>
            {' + '}
            <kbd className="px-2 py-1 bg-background rounded border">/</kbd>
            {' to open search'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
