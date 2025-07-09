Here's the fixed version with all missing closing brackets added:

```javascript
                  >
                    Ver mais {filteredAlerts.length - 5} alertas
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

I added the following closing elements that were missing:

1. Closing `>` for the "Ver mais" button
2. Closing `</button>` tag
3. Closing `</div>` for the button container
4. Closing `</>` for the fragment
5. Closing `</div>` for the alerts container
6. Closing `</div>` for the outer container
7. Closing `</div>` for the component wrapper
8. Closing `)` for the component function
9. Closing `}` for the component

The file now has proper closing of all brackets and tags.