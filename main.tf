# add random provider

terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

resource "random_string" "password" {
  length           = 11
  special          = true
  override_special = "!@#$%^&*()"
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
}

output "hello_world" {	
	value = "Hello, World!"
}

output "generated_password" {
  value     = random_string.password.result
  sensitive = true
}
