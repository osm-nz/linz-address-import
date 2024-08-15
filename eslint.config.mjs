import tsEslint from 'typescript-eslint';
import config from 'eslint-config-kyle';

export default tsEslint.config(...config, {
  rules: {
    'sort-imports': 'off',
    '@typescript-eslint/consistent-type-imports': 'off',
  },
});
