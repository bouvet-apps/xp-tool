<jsx{{#if isComponent}} name="{{name}}"{{/if}} type="compact">
{{#each imports}}
  {{{this}}}
{{/each}}
{{{content}}}
</jsx>
