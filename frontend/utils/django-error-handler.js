/**
 * Extract readable error messages from Django REST Framework error responses
 * @param {Object|string} error - The error response from Django
 * @returns {string} A formatted error message
 */
export function getDjangoErrorMessage(error) {
    // If error is a string, return it directly
    if (typeof error === 'string') {
        return error;
    }
    
    // If error is null or undefined, return a generic message
    if (!error) {
        return 'An error occurred';
    }
    
    // Check for 'detail' field, which is common in DRF for general errors
    if (error.detail) {
        if (Array.isArray(error.detail)) {
            return error.detail.join(', ');
        }
        if (typeof error.detail === 'string') {
            return error.detail;
        }
    }
    
    // Check for 'non_field_errors', which are general validation errors
    if (error.non_field_errors) {
        if (Array.isArray(error.non_field_errors)) {
            return error.non_field_errors.join(', ');
        }
        if (typeof error.non_field_errors === 'string') {
            return error.non_field_errors;
        }
    }
    
    // Handle field-specific errors
    const fieldErrors = [];
    
    for (const [field, messages] of Object.entries(error)) {
        // Skip fields we've already processed
        if (field === 'detail' || field === 'non_field_errors') {
            continue;
        }
        
        // Handle string arrays
        if (Array.isArray(messages)) {
            fieldErrors.push(`${formatFieldName(field)}: ${messages.join(', ')}`);
        } 
        // Handle nested errors 
        else if (typeof messages === 'object' && messages !== null) {
            const nestedErrors = getNestedErrors(messages, field);
            if (nestedErrors) {
                fieldErrors.push(nestedErrors);
            }
        } 
        // Handle direct string, number, or boolean messages
        else if (messages !== null && messages !== undefined) {
            fieldErrors.push(`${formatFieldName(field)}: ${messages}`);
        }
    }
    
    if (fieldErrors.length > 0) {
        return fieldErrors.join('\n');
    }
    
    // Fallback for unexpected error formats
    return 'An unexpected error occurred';
}

/**
 * Recursively extract messages from nested error objects
 */
function getNestedErrors(obj, parentField = '') {
    if (!obj || typeof obj !== 'object') {
        return '';
    }
    
    const nestedErrors = [];
    
    for (const [field, value] of Object.entries(obj)) {
        // Format each segment of the path with proper capitalization
        const formattedParent = parentField
            .split('.')
            .map(segment => formatFieldName(segment))
            .join('.');
            
        const fullFieldName = formattedParent ? `${formattedParent}.${formatFieldName(field)}` : formatFieldName(field);
        
        if (Array.isArray(value)) {
            nestedErrors.push(`${fullFieldName}: ${value.join(', ')}`);
        } else if (typeof value === 'object' && value !== null) {
            const deeperErrors = getNestedErrors(value, parentField ? `${parentField}.${field}` : field);
            if (deeperErrors) {
                nestedErrors.push(deeperErrors);
            }
        } else if (value !== null && value !== undefined) {
            nestedErrors.push(`${fullFieldName}: ${value}`);
        }
    }
    
    return nestedErrors.join('\n');
}

/**
 * Format field name to be more readable
 * Converts snake_case to Title Case and adds spaces
 */
function formatFieldName(field) {
    return field
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}