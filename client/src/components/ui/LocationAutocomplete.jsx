import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { geocodingApi } from "../../lib/api";
import { AUSTRALIAN_STATES } from "../../constants/locations";

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter a location",
  className,
  countryCode = "au", // Default to Australia
  disabled = false,
  ...props
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimeout = useRef(null);
  const wrapperRef = useRef(null);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await geocodingApi.search(query, countryCode, 5);
      const data = response.data.data || [];

      const formattedSuggestions = data.map((item) => ({
        display_name: item.display_name,
        address: item.address,
        lat: item.lat,
        lon: item.lon,
        place_id: item.place_id,
      }));

      setSuggestions(formattedSuggestions);
      setIsOpen(formattedSuggestions.length > 0);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);

    // Call onChange prop if provided
    if (onChange) {
      onChange(e);
    }

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout for API call (300ms debounce)
    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.display_name);
    setIsOpen(false);
    setSuggestions([]);

    // Helper function to map full state name to abbreviation
    const mapStateToCode = (stateName) => {
      if (!stateName) return "";

      // Find matching state by full name (case-insensitive)
      const state = AUSTRALIAN_STATES.find(
        (s) => s.name.toLowerCase() === stateName.toLowerCase()
      );

      // Return code if found, otherwise check if it's already a code
      if (state) return state.code;

      // Check if the input is already a valid state code
      const stateByCode = AUSTRALIAN_STATES.find(
        (s) => s.code.toLowerCase() === stateName.toLowerCase()
      );

      return stateByCode ? stateByCode.code : stateName;
    };

    // Extract address components
    const addressData = {
      fullAddress: suggestion.display_name,
      address: suggestion.address.road || suggestion.address.street || "",
      townSuburb:
        suggestion.address.suburb ||
        suggestion.address.town ||
        suggestion.address.city ||
        "",
      state: mapStateToCode(suggestion.address.state || ""),
      postalCode: suggestion.address.postcode || "",
      latitude: suggestion.lat,
      longitude: suggestion.lon,
    };

    // Call onSelect callback with detailed address data
    if (onSelect) {
      onSelect(addressData);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSuggestions([]);
    setIsOpen(false);
    if (onChange) {
      onChange({ target: { value: "" } });
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--color-foreground-muted))]" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-xl border border-[hsl(var(--color-border))] bg-[hsl(var(--color-surface-elevated))] pl-10 pr-10 py-2 text-sm text-[hsl(var(--color-foreground))] ring-offset-[hsl(var(--color-background))] placeholder:text-[hsl(var(--color-foreground-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-primary))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            className
          )}
          {...props}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-[hsl(var(--color-foreground-muted))] animate-spin" />
          )}
          {inputValue && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[hsl(var(--color-foreground-muted))] hover:text-[hsl(var(--color-foreground))] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[hsl(var(--color-card))] border border-[hsl(var(--color-border))] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-[hsl(var(--color-surface-elevated))] transition-colors border-b border-[hsl(var(--color-border))] last:border-b-0 flex items-start gap-2",
                selectedIndex === index &&
                  "bg-[hsl(var(--color-surface-elevated))]"
              )}
            >
              <MapPin className="w-4 h-4 text-[hsl(var(--color-foreground-muted))] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[hsl(var(--color-foreground))] truncate">
                  {suggestion.display_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
