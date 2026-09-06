import React, { useState, useEffect, useRef, useTransition } from 'react';
import { Search, X, ArrowLeft, BookOpen, FolderClosed, Gamepad2, ChevronRight, HelpCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { SearchResultItem } from '../../types';

interface SearchViewProps {
  onBack?: () => void;
  onSelectResult: (result: SearchResultItem) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onBack, onSelectResult }) => {
  const { searchService } = useData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const quickSuggestions = searchService.getQuickSuggestions();

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchService.search(trimmed);
        startTransition(() => {
          setResults(found);
          setHasSearched(true);
          setIsLoading(false);
        });
      } catch (err) {
        console.error('Erreur lors de la recherche :', err);
        startTransition(() => {
          setResults([]);
          setHasSearched(true);
          setIsLoading(false);
        });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query, searchService]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  const getResultIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'course':
        return <FolderClosed size={16} className="search-res-icon icon-course" />;
      case 'revision':
        return <BookOpen size={16} className="search-res-icon icon-revision" />;
      case 'quiz':
        return <Gamepad2 size={16} className="search-res-icon icon-quiz" />;
    }
  };

  const getTypeBadgeClass = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'course':
        return 'badge-course';
      case 'revision':
        return 'badge-revision';
      case 'quiz':
        return 'badge-quiz';
    }
  };

  return (
    <div className="search-view-container" id="search-view-container">
      {/* Barre de recherche supérieure */}
      <div className="search-header-bar">
        {onBack && (
          <button
            type="button"
            className="search-back-btn"
            onClick={onBack}
            aria-label="Retour"
            id="btn-search-back"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
        )}

        <div className="search-input-wrapper">
          <Search size={18} className="search-input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-main-input"
            id="search-main-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un cours, une notion, un quiz..."
            autoComplete="off"
            spellCheck="false"
          />
          {query.length > 0 && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClear}
              aria-label="Effacer"
              id="btn-search-clear"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="search-content">
        {/* État 1 : Chargement / Skeletons */}
        {isLoading && (
          <div className="search-skeletons-list" id="search-skeletons">
            {[1, 2, 3].map(i => (
              <div key={i} className="search-skeleton-card">
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-sub" />
              </div>
            ))}
          </div>
        )}

        {/* État 2 : Recherche vide (Accueil de recherche) */}
        {!isLoading && !hasSearched && query.trim() === '' && (
          <div className="search-empty-welcome" id="search-welcome">
            <div className="search-welcome-icon-box">
              <Search size={32} strokeWidth={1.75} />
            </div>
            <h2 className="search-welcome-title">Que veux-tu retrouver ?</h2>
            <p className="search-welcome-subtitle">
              Recherche instantanément dans tes cours importés, tes fiches de révision structurées et tes quiz de test.
            </p>

            {/* Suggestions rapides */}
            <div className="search-suggestions-section">
              <span className="search-suggestions-label">Suggestions rapides</span>
              <div className="search-suggestions-tags">
                {quickSuggestions.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className="search-suggestion-pill"
                    onClick={() => handleSuggestionClick(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* État 3 : Aucun résultat */}
        {!isLoading && hasSearched && results.length === 0 && (
          <div className="search-no-results" id="search-no-results">
            <div className="search-no-results-icon-box">
              <HelpCircle size={32} strokeWidth={1.75} />
            </div>
            <h3 className="search-no-results-title">Aucun résultat trouvé</h3>
            <p className="search-no-results-subtitle">
              Aucun cours, fiche ou quiz ne correspond à «&nbsp;<strong>{query}</strong>&nbsp;».
            </p>
            <p className="search-no-results-hint">
              Vérifie l’orthographe de ta recherche ou recherche par nom de matière (Mathématiques, SVT, Français...).
            </p>
            <button
              type="button"
              className="search-reset-btn"
              onClick={handleClear}
              id="btn-search-reset"
            >
              Effacer la recherche
            </button>
          </div>
        )}

        {/* État 4 : Liste des résultats */}
        {!isLoading && results.length > 0 && (
          <div className="search-results-section" id="search-results-section">
            <div className="search-results-header">
              <span className="search-results-count">
                {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="search-results-list" id="search-results-list">
              {results.map(item => (
                <div
                  key={item.id}
                  className="search-result-card"
                  onClick={() => onSelectResult(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectResult(item);
                    }
                  }}
                  id={`search-result-${item.id}`}
                >
                  <div className="search-result-left">
                    <div className="search-result-badges">
                      <span className={`search-type-badge ${getTypeBadgeClass(item.type)}`}>
                        {getResultIcon(item.type)}
                        <span>{item.badgeText}</span>
                      </span>
                      {item.subjectName && (
                        <span className="search-subject-badge">{item.subjectName}</span>
                      )}
                    </div>
                    <h4 className="search-result-title">{item.title}</h4>
                    {item.description && (
                      <p className="search-result-desc">{item.description}</p>
                    )}
                    {item.extraInfo && (
                      <span className="search-result-extra">{item.extraInfo}</span>
                    )}
                  </div>

                  <div className="search-result-right">
                    <span className="search-result-action">
                      <span>Consulter</span>
                      <ChevronRight size={16} strokeWidth={2.5} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
