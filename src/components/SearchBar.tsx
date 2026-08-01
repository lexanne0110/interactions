type Props = {
  className?: string;
};

export function SearchBar({ className = '' }: Props) {
  return (
    <div className={`search-bar-wrap content-column ${className}`.trim()}>
      <div className="search-bar">
        <img className="search-bar-back" src="/assets/icons/chevron-back.svg" alt="" aria-hidden />
        <span className="search-bar-placeholder">Search for &lsquo;Atta&rsquo;</span>
        <img className="search-bar-mic" src="/assets/icons/microphone.svg" alt="" aria-hidden />
      </div>
    </div>
  );
}
