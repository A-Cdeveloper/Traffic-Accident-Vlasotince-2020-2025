/** Past ISO dates so CI passes validateDateRange (must not be “future” vs runner’s clock). */
const PAST_START = '2022-01-15'
const PAST_END = '2022-01-20'

describe('Homepage Filters', () => {
  beforeEach(() => {
    // Deterministic filter options — without API, categories stay empty and checkboxes never render
    cy.intercept('GET', '**/api/accidents/metadata', {
      statusCode: 200,
      body: {
        accidentTypes: [{ value: 'materijalna', label: 'Sa materijalnom štetom' }],
        categories: [
          { value: 'jedno-vozilo', label: 'Jedno vozilo' },
          { value: 'pesaci', label: 'Pešaci' },
        ],
        lastUpdated: '2026-01-01T12:00:00Z',
      },
    }).as('filtersMetadata')

    cy.intercept('GET', '**/api/accidents?*', {
      statusCode: 200,
      body: {
        pstation: 'VLASOTINCE',
        startDate: null,
        endDate: null,
        accidentType: null,
        categories: null,
        total: 0,
        data: [],
      },
    }).as('accidentsList')

    cy.visit('/')
  })

  it('should allow entering start date', () => {
    cy.get('[data-testid="date-input-startDate"]').clear().type(PAST_START);
    cy.get('[data-testid="date-input-startDate"]').should('have.value', PAST_START);
  });

  it('should allow entering end date', () => {
    cy.get('[data-testid="date-input-endDate"]').clear().type(PAST_END);
    cy.get('[data-testid="date-input-endDate"]').should('have.value', PAST_END);
  });

  it('should show toast error when start date is greater than end date', () => {
    cy.get('[data-testid="date-input-startDate"]').clear().type(PAST_END);
    cy.get('[data-testid="date-input-endDate"]').clear().type(PAST_START);
    cy.get('[data-testid="filter-submit"]').click();
    cy.contains('Datum početka mora biti pre datuma završetka intervala', { timeout: 5000 }).should('be.visible');
  });

  it('should allow selecting accident type', () => {
    cy.get('[data-testid="accident-type-select"]').click();
    cy.contains('Svi tipovi').click({ force: true });
    cy.get('[data-testid="accident-type-select"]').should('contain', 'Svi tipovi');
  });

  it('should allow selecting categories in multiselect', () => {
    cy.get('[data-testid="category-multiselect"]', { timeout: 15000 }).should('not.be.disabled')
    cy.get('[data-testid="category-multiselect"]').click()

    cy.get('[data-testid^="category-checkbox-"]', { timeout: 10000 }).should('exist')

    // Select first category
    cy.get('[data-testid^="category-checkbox-"]').first().as('firstCheckbox');
    cy.get('@firstCheckbox').then(($checkbox) => {
      const checkboxId = $checkbox.attr('id');
      cy.get(`label[for="${checkboxId}"]`).click();
      cy.get('@firstCheckbox').should('have.attr', 'data-state', 'checked');

      // Verify button text shows selected count
      cy.get('[data-testid="category-multiselect"]').should('contain', '1 kategorija');

      // Deselect
      cy.get(`label[for="${checkboxId}"]`).click();
      cy.get('@firstCheckbox').should('not.have.attr', 'data-state', 'checked');

      // Verify button text shows placeholder
      cy.get('[data-testid="category-multiselect"]').should('contain', 'Izaberi kategorije');
    });
  });

  it('should apply filters when submit button is clicked', () => {
    cy.get('[data-testid="date-input-startDate"]').clear().type(PAST_START);
    cy.get('[data-testid="date-input-endDate"]').clear().type(PAST_END);
    cy.get('[data-testid="filter-submit"]').click();

    cy.url().should('include', `startDate=${PAST_START}`);
    cy.url().should('include', `endDate=${PAST_END}`);
  });

  it('should reset filters when reset button is clicked', () => {
    cy.get('[data-testid="date-input-startDate"]').clear().type(PAST_START);
    cy.get('[data-testid="date-input-endDate"]').clear().type(PAST_END);
    cy.get('[data-testid="filter-reset"]').click();

    cy.url({ timeout: 10000 }).should('include', 'startDate=2026-01-01');
    cy.url().should('include', 'endDate=');
  });
});
