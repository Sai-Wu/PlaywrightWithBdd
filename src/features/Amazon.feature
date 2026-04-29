Feature: Testing Amazon UI
    Scenario Outline: Testing the login functionality
        Given I am on the homepage
        When I navigate to the login page from the homepage
        Then I should see the login page
        Examples: 
            | username  | password  |
            | user1     | pass1     |
            | user2     | pass2     |