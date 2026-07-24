import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

const SearchableSelect = ({ label, value, options, onChange, width = 'w-44' }) => {
  const stringOptions = (options || []).map((o) => String(o));
  const current = value === '' || value == null ? null : String(value);

  return (
    <div className={width}>
      <Autocomplete
        size="small"
        disablePortal
        options={stringOptions}
        value={current}
        onChange={(_, v) => onChange(v ?? '')}
        isOptionEqualToValue={(opt, val) => String(opt) === String(val)}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={label}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '0.5rem',
                backgroundColor: '#fff',
                fontSize: '0.875rem',
                paddingY: '2px',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
                '&.Mui-focused fieldset': { borderColor: '#06b6d4', borderWidth: '1px' },
              },
              '& .MuiOutlinedInput-input': { paddingY: '6px !important' },
              '& .MuiInputLabel-root': { display: 'none' },
            }}
          />
        )}
        slotProps={{
          paper: {
            sx: {
              borderRadius: '0.5rem',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 4px 10px -3px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e2e8f0',
              fontSize: '0.875rem',
            },
          },
          listbox: {
            sx: {
              maxHeight: '15rem',
              fontSize: '0.875rem',
              '& .MuiAutocomplete-option': { paddingY: '6px' },
              '& .MuiAutocomplete-option[aria-selected="true"]': {
                backgroundColor: '#ecfeff',
                color: '#0e7490',
                fontWeight: 600,
              },
              '& .MuiAutocomplete-option.Mui-focused': { backgroundColor: '#f0fdff' },
            },
          },
        }}
      />
    </div>
  );
};

export default SearchableSelect;
