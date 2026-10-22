resource "aws_security_group" "bastion" {
  name = "bastion"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_db_instance" "main" {
  engine              = "postgres"
  publicly_accessible = true
}

resource "aws_s3_bucket" "exports" {
  bucket = "insecure-exports"
  acl    = "public-read"
}

resource "aws_iam_policy" "admin" {
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", "Action": "*", "Resource": "*" }]
  })
}
