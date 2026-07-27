Feature: Aldi Storefront testing

    This featurefile tests the Aldi.us Storefront

    Scenario: Item boundary value test
        Given I open the aldi.us website without logging in
        When I add search for Ham in the searchbar
        And I open 'Lunch Mate 1lb Honey Ham' Item
        And I select 'Custom Amount' in the quantity
        When I enter 501 in the quantity field
        Then 'Add to Cart' is disabled
        When I enter 500 in the quantity field
        Then 'Add to Cart' is enabled

    Scenario: Ordering items without logging in
        Given I open the aldi.us website without logging in
        And I have an item in my basket
        And I click on my basket icon
        When click on 'Go to Checkout'
        Then I am redirected to the login page

    Scenario: Setting non-number custom quantity
        Given I open the aldi.us website without logging in
        When I add search for Ham in the searchbar
        And I open 'Lunch Mate 1lb Honey Ham' Item
        And I select 'Custom Amount' in the quantity
        When I enter 'not-a-number' in the quantity field
        Then 'Add to Cart' is disabled

    Scenario: Removing an item from the shopping list
        Given I open the aldi.us website without logging in
        And I have an item in my basket
        And I click on my basket icon
        When I click on the Trash icon
        Then the item is removed from the shopping list
