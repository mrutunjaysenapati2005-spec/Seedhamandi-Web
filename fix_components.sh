#!/bin/bash
for file in src/components/*.tsx; do
  # Skip Navbar since we already did it carefully
  if [[ "$file" == *"Navbar.tsx" ]]; then continue; fi

  # Add transition-colors to main container divs (heuristic)
  sed -i 's/className="bg-white/className="bg-white transition-colors/g' "$file"
  
  # Basic safe replacements
  sed -i 's/bg-white /bg-white dark:bg-stone-900 /g' "$file"
  sed -i 's/bg-white"/bg-white dark:bg-stone-900"/g' "$file"
  
  sed -i 's/text-stone-900 /text-stone-900 dark:text-stone-100 /g' "$file"
  sed -i 's/text-stone-900"/text-stone-900 dark:text-stone-100"/g' "$file"
  
  sed -i 's/text-stone-800 /text-stone-800 dark:text-stone-200 /g' "$file"
  sed -i 's/text-stone-800"/text-stone-800 dark:text-stone-200"/g' "$file"
  
  sed -i 's/text-stone-700 /text-stone-700 dark:text-stone-300 /g' "$file"
  sed -i 's/text-stone-700"/text-stone-700 dark:text-stone-300"/g' "$file"
  
  sed -i 's/text-stone-600 /text-stone-600 dark:text-stone-300 /g' "$file"
  sed -i 's/text-stone-600"/text-stone-600 dark:text-stone-300"/g' "$file"
  
  sed -i 's/text-stone-500 /text-stone-500 dark:text-stone-400 /g' "$file"
  sed -i 's/text-stone-500"/text-stone-500 dark:text-stone-400"/g' "$file"
  
  sed -i 's/border-stone-200 /border-stone-200 dark:border-stone-700 /g' "$file"
  sed -i 's/border-stone-200"/border-stone-200 dark:border-stone-700"/g' "$file"
  
  sed -i 's/bg-stone-50 /bg-stone-50 dark:bg-stone-950 /g' "$file"
  sed -i 's/bg-stone-50"/bg-stone-50 dark:bg-stone-950"/g' "$file"
  
  sed -i 's/bg-stone-100 /bg-stone-100 dark:bg-stone-800 /g' "$file"
  sed -i 's/bg-stone-100"/bg-stone-100 dark:bg-stone-800"/g' "$file"
done
