@Amazon
Feature: Testing Amazon UI
    Scenario Outline: Add item within budget to cart
        Given I navigate to the homepage
        When I navigate to the login page from the homepage
        Then I should see the login page
        When I login with credentials
        Then I should be logged in successfully
        When I search for "<searchTerm>"
        Then I should see search results
        And I should see <numOfProductCards> or more product cards
        Then Add a product to cart from the search results that is less than or equal to <budget> dollars
        Examples: 
            | searchTerm  |numOfProductCards|budget |
            | laptop      |2                |1500.00|
    
    # Scenario Outline: Testing the Event page Functionality
    #     Given I navigate to the homepage
    #     When I navigate to the login page from the homepage
    #     Then I should see the login page
    #     When I login with credentials
    #     Then I should be logged in successfully

    #     Examples: 
    #         | searchTerm  |
    #         | laptop      |