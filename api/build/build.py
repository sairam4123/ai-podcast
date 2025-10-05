# This script merges two or more python files into one
# It assumes that the files are in the same directory and that there are no circular imports
# It also assumes that the functions have unique names within each file, but they may have duplicates across files
# It uses a prefix for the functions based on the file name
# It handles different types of import statements and only replaces the imports if there is a matching python file to be merged
# It also checks if the merged file is runnable and reports any errors or warnings

import os
import re
import sys

# The names of the files to be merged
files = ["api/env.py", "api/utils.py", "api/models.py", "api/db.py", "api/gen.py", "api/main.py",]

# The name of the output file
output = "api/dist/main.py"

# A function to get the prefix for a file name
def get_prefix(filename):
  # Remove the extension and capitalize the first letter
  prefix = filename.split(".")[0].capitalize()
  # Add an underscore at the end
  prefix += "_"
  return prefix

# A function to rename the functions in a file with a prefix
def rename_functions(filename, prefix):
  # Open the file in read mode
  with open(filename, "r",encoding="utf-8") as infile:
    # Read the content of the file as a string
    content = infile.read()
    # Find all the function definitions in the file using a regular expression
    # The pattern matches any line that starts with "def" followed by a space and a word
    pattern = r"^def (\w+)"
    # Replace the function name with the prefix and the function name
    # The replacement string uses backreferences to capture groups in the pattern
    # \1 refers to the first group, which is the function name
    content = re.sub(pattern, f"def {prefix}\\1", content, flags=re.MULTILINE)
    # Return the modified content
    return content

# A function to handle different types of import statements in a file
def handle_imports(filename):
  # Open the file in read mode
  with open(filename, "r",encoding="utf-8") as infile:
    # Read the content of the file as a string
    content = infile.read()
    # Find all the import statements in the file using a regular expression
    # The pattern matches any line that starts with "import" or "from"
    pattern = r"^(import|from) .+"
    # For each match, check if it is a local module or a remote library
    for match in re.finditer(pattern, content, flags=re.MULTILINE):
      # Get the matched string and its start and end positions
      statement = match.group()
      start = match.start()
      end = match.end()
      # Split the statement by spaces and get the module name or alias
      parts = statement.split()
      if parts[0] == "import":
        module = parts[1].split(".")[0]
      elif parts[0] == "from":
        module = parts[1]
      else:
        continue
      
      if module.startswith("api."):
        print(f"Processing local module: {module}")
        # If the module starts with "api.", it is a local module
        module = "/".join(module.split(".")) # Convert the module name to a file path
        
      # Check if there is a matching python file for the module in the same directory
      if module + ".py" in files:
        print(f"Found matching file for module: {module}.py")
        # Get the prefix for the module name
        prefix = get_prefix(module + ".py")
        # Replace the module name or alias with the prefix in the statement
        statement = statement.replace(module, prefix)
        # Replace the original statement with the modified statement in the content
        content = content[:start] + statement + content[end:]

    # Remove all api imports
    content = re.sub(r"^(import|from) api\..+", "", content, flags=re.MULTILINE)
    # Return the modified content
    return content

# A function to merge two or more files into one
def merge_files(files, output):
  # Open the output file in write mode
  with open(output, "w",encoding="utf-8") as outfile:
    # For each file in the list of files to be merged
    for filename in files:
      # Get the prefix for each file
      prefix = get_prefix(filename)
      # Rename the functions in each file with the prefixes
      content = rename_functions(filename, prefix)
      # Handle different types of import statements in each file
      content = handle_imports(filename)
      # Write a comment to indicate which file is being merged
      outfile.write(f"# Merging {filename}\n")
      # Write the content of each file to the output file
      outfile.write(content)
      # Write a newline character to separate the files
      outfile.write("\n")

# Call the merge function with the given files and output
merge_files(files, output)

# Check if the merged file is runnable and report any errors or warnings

try:
  # Execute the merged file as a script using execfile (Python 2) or exec (Python 3)
  if sys.version_info[0] == 2:
    execfile(output)
  else:
    exec(open(output,encoding="utf-8").read())
  # Print a success message if no exceptions are raised
  print(f"The merged file {output} is runnable.")
except Exception as e:
  # Print the exception type and message if any exceptions are raised
  print(f"The merged file {output} is not runnable.")
  print(f"Exception type: {type(e).__name__}")
  print(f"Exception message: {e}")